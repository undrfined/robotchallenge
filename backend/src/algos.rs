use crate::utils::wasm_module::LibInfo;
use crate::{actions, models, utils, DbPool};
use actix_multipart::Multipart;
use actix_web::error::ErrorInternalServerError;
use actix_web::{get, post, web, Error, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AlgoJsonResult {
    pub algo_id: i32,
    pub algo_version_id: i32,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunGamePayload {
    pub algo_versions: Vec<i32>,
}

#[get("/")]
pub(crate) async fn get_algos(
    pool: web::Data<DbPool>,
) -> Result<web::Json<Vec<models::Algo>>, Error> {
    let algos = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_all_algos(&mut conn)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError)?;

    Ok(web::Json(algos))
}

#[get("/{algo_id}/")]
pub(crate) async fn get_algo_versions(
    pool: web::Data<DbPool>,
    algo_version_id: web::Path<i32>,
) -> Result<web::Json<Vec<models::AlgoVersion>>, Error> {
    let algo = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_algo_versions(&mut conn, algo_version_id.into_inner())
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError)?;

    Ok(web::Json(algo))
}

#[post("/run/")]
pub(crate) async fn run(
    user: models::User,
    pool: web::Data<DbPool>,
    payload: web::Json<RunGamePayload>,
) -> Result<web::Json<Vec<LibInfo>>, Error> {
    let algos = payload.algo_versions.clone();
    let algos_fetched = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_algos(&mut conn, algos)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError)?;

    let lib_infos = algos_fetched
        .iter()
        .map(|x| utils::wasm_module::get_lib_info(&x.file).unwrap())
        .collect();

    Ok(web::Json(lib_infos))
}

#[post("/")]
pub(crate) async fn create_algo(
    user: models::User,
    pool: web::Data<DbPool>,
    mut payload: Multipart,
) -> Result<web::Json<AlgoJsonResult>, Error> {
    use actix_web::{middleware, web, App, Error, HttpResponse, HttpServer};
    use futures::{StreamExt, TryStreamExt};

    if let Ok(Some(mut field)) = payload.try_next().await {
        println!("Field: {:?}", field);
        let content_type = field.content_disposition();
        let filename = content_type.get_filename().unwrap();
        println!("File name: {:?}, type {:?}", filename, content_type);

        // Get data to Vec<u8>
        let mut data = web::BytesMut::new();
        while let Some(chunk) = field.next().await {
            data.extend_from_slice(&chunk?);
        }

        let data = data.to_vec();

        let fid = web::block(move || {
            let lib_info = utils::wasm_module::get_lib_info(&data).expect("failed to get lib info");

            let new_algo = models::NewAlgo {
                name: lib_info.name,
                user_id: user.id.clone(),
                language: lib_info.language,
            };

            let new_algo_version = models::NewAlgoVersion {
                file: data,
                version: lib_info.version,
            };

            println!("inserting {:?}", new_algo);
            let mut conn = pool.get()?;
            actions::insert_new_algo(&mut conn, new_algo, new_algo_version)
        })
        .await
        .map_err(ErrorInternalServerError)?
        .map_err(ErrorInternalServerError)?;

        return Ok(web::Json(AlgoJsonResult {
            algo_id: fid.0,
            algo_version_id: fid.1,
        }));
    }

    Err(ErrorInternalServerError("algo not found"))
}

#[get("/file/{algo_id}/")]
pub(crate) async fn get_algo_file(
    pool: web::Data<DbPool>,
    algo_version_id: web::Path<i32>,
) -> Result<HttpResponse, Error> {
    let algo_file = web::block(move || {
        let mut conn = pool.get()?;
        actions::get_algo_file(&mut conn, algo_version_id.into_inner())
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError)?;

    Ok(HttpResponse::Ok().body(algo_file))
}
