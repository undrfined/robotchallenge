#[cfg(test)]
mod tests {
    use crate::models::{
        Algo, AlgoVersion, Category, CategoryIcon, NewCategory, NewUserGroup, UserGroup, UserRole,
    };
    use crate::{algos, auth, categories, models, user_groups, users, DbPool};
    use actix_cors::Cors;
    use actix_identity::IdentityMiddleware;
    use std::future::Future;
    use std::io::Read;
    use std::path::PathBuf;
    use std::{env, fs};

    use actix_http::header::{HeaderMap, HeaderName, HeaderValue};
    use actix_http::{header, HttpMessage, Request};
    use actix_multipart::Multipart;
    use actix_session::{storage, SessionMiddleware};
    use actix_web::body::MessageBody;
    use actix_web::cookie::{Cookie, Key};
    use actix_web::middleware::{Logger, NormalizePath, TrailingSlash};
    use actix_web::{test, HttpRequest};
    use actix_web::{web, App, Error};
    use serde_json::json;

    use crate::algos::{AlgoJsonResult, RunGamePayload};
    use crate::utils::wasm_module::LibInfo;
    use actix_web::test::TestRequest;
    use actix_web::{dev as ax_dev, dev::Service as _, Error as AxError};
    use diesel::{sql_query, Connection, PgConnection, RunQueryDsl};

    pub struct DeadDrop {
        pool: DbPool,
        url: String,
        name: String,
    }

    impl Drop for DeadDrop {
        fn drop(&mut self) {
            let conn_spec = env::var("DATABASE_URL").expect("Please specify DATABASE_URL");

            let mut conn =
                diesel_logger::LoggingConnection::new(PgConnection::establish(&conn_spec).unwrap());
            sql_query(format!(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{}'",
                self.name
            ))
            .execute(&mut conn)
            .unwrap();
            sql_query(format!("DROP DATABASE {}", self.name))
                .execute(&mut conn)
                .unwrap();
        }
    }

    macro_rules! app (
    ($pool: expr) => ({
        let redis_connection_string = "redis:6379";

        // let key = Key::generate();
        let k: [u8; 64] = [
            34, 22, 36, 247, 253, 133, 134, 177, 54, 1, 39, 6, 242, 231, 90, 159, 18, 3, 187, 31, 140,
            162, 139, 15, 189, 230, 146, 230, 132, 151, 106, 231, 110, 235, 36, 45, 55, 213, 217, 30,
            122, 254, 109, 145, 189, 3, 146, 70, 187, 101, 117, 72, 127, 175, 3, 73, 108, 25, 61, 130,
            17, 133, 254, 252,
        ];
        let key = Key::from(&k);
        App::new()
                .app_data(web::Data::new($pool.clone()))
                .wrap(Logger::default())
                // TODO real bad
                .wrap(Cors::permissive())
                .wrap(IdentityMiddleware::default())
                .wrap(SessionMiddleware::new(
                    storage::RedisActorSessionStore::new(redis_connection_string),
                    key.clone(),
                ))
                .wrap(NormalizePath::new(TrailingSlash::Always))
                .service(
                    web::scope("users")
                        .service(users::get_user)
                        .service(users::get_user_by_id),
                )
                .service(
                    web::scope("categories")
                        .service(categories::get_categories)
                        .service(categories::create_category),
                )
                .service(
                    web::scope("algos")
                        .service(algos::create_algo)
                        .service(algos::get_algo_versions)
                        .service(algos::run)
                        .service(algos::get_algos)
                        .service(algos::get_algo_file),
                )
                .service(
                    web::scope("auth")
                        .service(auth::login)
                        .service(auth::logout),
                )
                .service(
                    web::scope("userGroups")
                        .service(user_groups::get_user_groups)
                        .service(user_groups::create_user_group)
                        .service(user_groups::attach_to_user_group),
                )
                .service(auth::callback)
    });
);
    async fn login(
        app: &impl ax_dev::Service<
            Request,
            Response = actix_web::dev::ServiceResponse<impl MessageBody>,
            Error = AxError,
        >,
        role: UserRole,
    ) -> Cookie<'static> {
        let req = TestRequest::get()
            .uri(
                format!(
                    "/callback?code=1&state=2&role={}",
                    (if role == UserRole::Admin {
                        "admin".to_string()
                    } else {
                        "user".to_string()
                    })
                )
                .as_str(),
            )
            .to_request();
        let resp = test::call_service(&app, req).await;
        let cookie = resp.response().cookies().next();
        assert!(cookie.is_some(), "Failed to login");
        assert!(resp.status().is_redirection(), "Failed to login");
        let cookie = cookie.unwrap();
        println!("{:?}", resp.headers());
        cookie.into_owned()
    }

    pub async fn init_test() -> (
        impl ax_dev::Service<
            Request,
            Response = actix_web::dev::ServiceResponse<impl MessageBody>,
            Error = AxError,
        >,
        DeadDrop,
    ) {
        dotenv::from_filename(".env.test").ok();
        let (pool, url, name) = crate::db::init_db();
        let mut conn = pool.get().unwrap();

        let app = test::init_service(app!(pool)).await;
        let dd = DeadDrop {
            pool: pool.clone(),
            url,
            name,
        };
        (app, dd)
    }

    #[actix_web::test]
    async fn admin_can_insert_category() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::Admin).await;

        let new_category = NewCategory {
            name: "test".to_string(),
            description: "test".to_string(),
            game_config: json!({}),
            deadline_at: None,
            description_short: "test".to_string(),
            icon: CategoryIcon::Crown,
            max_points: 100,
        };
        let req = TestRequest::post()
            .uri("/categories")
            .set_json(new_category)
            .cookie(cookie)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to create category");
        let resp: Category = test::read_body_json(resp).await;
        assert_eq!(resp.id, 1, "Category id should be 1");

        let req = TestRequest::default().uri("/categories").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to retrieve categories");
        let resp: Vec<Category> = test::read_body_json(resp).await;
        assert_eq!(resp.len(), 1, "Categories should not be empty");
        assert_eq!(resp[0].id, 1, "Category id should be 1");
    }

    #[actix_web::test]
    async fn user_cant_insert_category() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;

        let new_category = NewCategory {
            name: "test".to_string(),
            description: "test".to_string(),
            game_config: json!({}),
            deadline_at: None,
            description_short: "test".to_string(),
            icon: CategoryIcon::Crown,
            max_points: 100,
        };
        let req = TestRequest::post()
            .uri("/categories")
            .set_json(new_category)
            .cookie(cookie)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "User should not be able to create category"
        );
    }

    #[actix_web::test]
    async fn category_list_should_be_empty() {
        let (app, dead_drop) = init_test().await;

        let req = TestRequest::default().uri("/categories").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to retrieve categories");
        let resp: Vec<Category> = test::read_body_json(resp).await;
        assert_eq!(resp.len(), 0, "Categories should be empty");
    }

    #[actix_web::test]
    async fn login_should_word() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let req = TestRequest::default()
            .uri("/users/")
            .cookie(cookie)
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to retrieve user");
    }

    #[actix_web::test]
    async fn logout_should_work() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let req = TestRequest::default()
            .uri("/users/")
            .cookie(cookie.clone())
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to retrieve user");

        let req = TestRequest::default()
            .uri("/auth/logout")
            .cookie(cookie.clone())
            .to_request();
        let resp = test::call_service(&app, req).await;
        print!("{:?}", resp.headers());
        assert_eq!(
            resp.response().cookies().next().unwrap().name(),
            "id",
            "Failed to logout"
        );
        assert_eq!(
            resp.response().cookies().next().unwrap().value(),
            "",
            "Failed to logout"
        );
        assert!(resp.status().is_success(), "Failed to logout");
    }

    #[actix_web::test]
    async fn should_return_user_groups() {
        let (app, dead_drop) = init_test().await;

        let req = TestRequest::default().uri("/userGroups/").to_request();
        let resp = test::call_service(&app, req).await;
        println!("{:?}", resp.response());
        assert!(resp.status().is_success(), "Failed to retrieve user groups");
    }

    #[actix_web::test]
    async fn should_not_attach_to_non_existent_user_group() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;

        let req = TestRequest::default()
            .uri("/userGroups/attach/1")
            .cookie(cookie.clone())
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(!resp.status().is_success(), "Failed to retrieve user group");
    }

    #[actix_web::test]
    async fn should_attach_to_user_group() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::Admin).await;

        let user_group = NewUserGroup {
            name: "test".to_string(),
        };
        let req = TestRequest::post()
            .uri("/userGroups/")
            .cookie(cookie.clone())
            .set_json(user_group)
            .to_request();
        let resp = test::call_service(&app, req).await;
        println!("{:?}", resp.response());
        assert!(resp.status().is_success(), "Failed to create user group");
        let resp: UserGroup = test::read_body_json(resp).await;
        assert_eq!(resp.id, 1, "User group id should be 1");

        let req = TestRequest::default()
            .uri("/userGroups/attach/1")
            .cookie(cookie.clone())
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to attach to user group");
    }

    #[actix_web::test]
    async fn user_cant_create_user_group() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;

        let user_group = NewUserGroup {
            name: "test".to_string(),
        };
        let req = TestRequest::post()
            .uri("/userGroups/")
            .cookie(cookie.clone())
            .set_json(user_group)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(!resp.status().is_success(), "Failed to create user group");
    }

    #[actix_web::test]
    async fn admin_can_create_user_group() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::Admin).await;

        let user_group = NewUserGroup {
            name: "test".to_string(),
        };
        let req = TestRequest::post()
            .uri("/userGroups/")
            .cookie(cookie.clone())
            .set_json(user_group)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to create user group");
        let resp: UserGroup = test::read_body_json(resp).await;
        assert_eq!(resp.id, 1, "User group id should be 1");
    }

    #[actix_web::test]
    async fn can_get_algos() {
        let (app, dead_drop) = init_test().await;

        let req = TestRequest::default().uri("/algos/").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Failed to get algos");
        let resp: Vec<Algo> = test::read_body_json(resp).await;
        assert_eq!(resp.len(), 0, "Algos should be empty");
    }

    #[actix_web::test]
    async fn cant_upload_without_login() {
        let (app, dead_drop) = init_test().await;

        let req = TestRequest::post().uri("/algos/").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "Should not upload without login"
        );
    }

    #[actix_web::test]
    async fn cant_upload_without_payload() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "Should not upload without payload"
        );
    }

    #[actix_web::test]
    async fn cant_upload_with_invalid_payload() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload("invalid")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "Should not upload with invalid payload"
        );
    }

    #[actix_web::test]
    async fn can_upload_algo() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        println!("{:?} {:?}", resp.status(), resp.response());
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");
    }

    #[actix_web::test]
    async fn can_upload_new_algo_version() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");

        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp_new.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp_new.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 2, "Algo version id should be 2");
    }

    #[actix_web::test]
    async fn cant_upload_same_algo_version() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");

        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp_new.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "Should not upload algo successfully"
        );
    }

    #[actix_web::test]
    async fn cant_upload_algo_without_get_lib_info() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/rust_no_lib_info.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            !resp.status().is_success(),
            "Should not upload algo successfully"
        );
    }

    #[actix_web::test]
    async fn can_run_algo() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");

        let run_game_payload = RunGamePayload {
            algo_versions: vec![resp.algo_version_id],
        };
        let req = TestRequest::post()
            .uri("/algos/run")
            .cookie(cookie.clone())
            .set_json(run_game_payload)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Should run algo successfully");
        let resp: Vec<LibInfo> = test::read_body_json(resp).await;
        assert_eq!(resp.len(), 1, "Should return 1 lib info");
        assert_eq!(resp[0].name, "My Library", "Should return correct lib info");
        assert_eq!(resp[0].version, "1.2.5", "Should return correct lib info");
        assert_eq!(resp[0].language, "csharp", "Should return correct lib info");
    }

    #[actix_web::test]
    async fn cant_run_non_existent_algo() {
        let (app, dead_drop) = init_test().await;
        let run_game_payload = RunGamePayload {
            algo_versions: vec![1],
        };

        let req = TestRequest::post()
            .uri("/algos/run")
            .set_json(run_game_payload)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(!resp.status().is_success(), "Should run algo successfully");
    }

    #[actix_web::test]
    async fn can_run_multiple_algos() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");

        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp_new.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 2, "Algo version id should be 1");

        let run_game_payload = RunGamePayload {
            algo_versions: vec![1, 2],
        };
        let req = TestRequest::post()
            .uri("/algos/run")
            .cookie(cookie.clone())
            .set_json(run_game_payload)
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Should run algo successfully");
        let resp: Vec<LibInfo> = test::read_body_json(resp).await;
        assert_eq!(resp.len(), 2, "Should return 2 lib infos");
        assert_eq!(resp[0].name, "My Library", "Should return correct lib info");
        assert_eq!(resp[0].version, "1.2.5", "Should return correct lib info");
        assert_eq!(resp[0].language, "csharp", "Should return correct lib info");
        assert_eq!(resp[1].name, "My Library", "Should return correct lib info");
        assert_eq!(resp[1].version, "1.3.5", "Should return correct lib info");
        assert_eq!(resp[1].language, "csharp", "Should return correct lib info");
    }

    #[actix_web::test]
    async fn can_retrieve_algo_file() {
        let (app, dead_drop) = init_test().await;
        let cookie = login(&app, UserRole::User).await;
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("__mock__/csharp.wasm");
        let file = fs::read(d).unwrap();

        let file_with_multipart = [
            "------WebKitFormBoundaryMdWtRXJ0UHe7KQZL\r\nContent-Disposition: form-data; name=\"file\"; filename=\"csharp.wasm\"\r\nContent-Type: application/wasm\r\n\r\n".as_bytes(),
            file.as_slice(),
            "\r\n------WebKitFormBoundaryMdWtRXJ0UHe7KQZL--\r\n".as_bytes()
        ].concat();

        let req = TestRequest::post()
            .uri("/algos/")
            .cookie(cookie.clone())
            .set_payload(file_with_multipart)
            .append_header((
                header::CONTENT_TYPE,
                "multipart/form-data; boundary=----WebKitFormBoundaryMdWtRXJ0UHe7KQZL",
            ))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should upload algo successfully"
        );
        let resp: AlgoJsonResult = test::read_body_json(resp).await;
        println!("{:?}", resp);
        assert_eq!(resp.algo_id, 1, "Algo id should be 1");
        assert_eq!(resp.algo_version_id, 1, "Algo version id should be 1");

        let req = TestRequest::get()
            .uri("/algos/file/1")
            .cookie(cookie.clone())
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(
            resp.status().is_success(),
            "Should retrieve algo file successfully"
        );
        let resp = test::read_body(resp).await;
        assert_eq!(resp, file, "Should retrieve correct algo file");
    }
}
