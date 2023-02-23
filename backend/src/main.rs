#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_identity::{Identity, IdentityMiddleware};
use actix_multipart::Multipart;
use actix_session::storage::SessionStore;
use actix_session::{storage, SessionMiddleware};
use actix_web::cookie::Key;
use actix_web::dev::Payload;
use actix_web::error::{
    ErrorBadRequest, ErrorForbidden, ErrorInternalServerError, ErrorUnauthorized,
};
use actix_web::middleware::Logger;
use actix_web::{
    get, post, web, App, Error, FromRequest, HttpMessage, HttpRequest, HttpResponse, HttpServer,
    Responder,
};
use anyhow;
use dotenv::dotenv;
use log::{info, warn};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge, RedirectUrl,
    Scope, TokenResponse, TokenUrl,
};
use octocrab::models::UserId;
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::future::Future;
use std::pin::Pin;
use std::sync::RwLock;
use std::time::Duration;
use url::Url;

use diesel::backend::Backend;
use diesel::pg::Pg;
use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

mod actions;
mod algos;
mod auth;
mod categories;
mod models;
mod schema;
mod users;

impl FromRequest for models::User {
    // type Config = ();
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<models::User, Error>>>>;

    fn from_request(req: &HttpRequest, pl: &mut Payload) -> Self::Future {
        println!("from_request");
        let fut = Identity::from_request(req, pl);
        let poolO: Option<&web::Data<DbPool>> = req.app_data();
        if poolO.is_none() {
            warn!("sessions is empty(none)!");
            return Box::pin(async { Err(ErrorUnauthorized("unauthorized")) });
        }
        let pool = poolO.unwrap().clone();
        println!("sessions: {:?}", pool);
        Box::pin(async move {
            let k = fut.await;

            if let Ok(identity) = k {
                println!("identity: {:?}", identity.id());
                let id = identity.id().unwrap().to_string();
                // use web::block to offload blocking Diesel code without blocking server thread
                let user = web::block(move || {
                    let mut conn = pool.get()?;
                    actions::find_user_by_uid(&mut conn, id)
                })
                .await
                .map_err(|e| {
                    println!("Error: {}", e);
                    ErrorUnauthorized("fuck")
                })?;

                if let Ok(user) = user {
                    return match user {
                        Some(user) => Ok(user),
                        None => Err(ErrorUnauthorized("unauthorized")),
                    };
                }
                // .map_err(actix_web::error::ErrorInternalServerError)?;
                // return Ok(user);
                // if let Some(user) = sessions
                //     .read()
                //     .unwrap()
                //     .map
                //     .get(&identity.id().unwrap().to_string())
                //     .map(|x| x.clone())
                // {
                //     return Ok(user);
                // }
            } else {
                println!("identity fail");
            }

            Err(ErrorUnauthorized("unauthorized"))
        })
    }
}

type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

fn run_migrations(
    connection: &mut impl MigrationHarness<Pg>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let redis_connection_string = "redis:6379";

    let conn_spec = env::var("DATABASE_URL").expect("Please specify DATABASE_URL");
    let manager = ConnectionManager::<PgConnection>::new(conn_spec);
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.");

    let mut conn = pool.get().unwrap();
    run_migrations(&mut conn).unwrap();

    // let key = Key::generate();
    let k: [u8; 64] = [
        34, 22, 36, 247, 253, 133, 134, 177, 54, 1, 39, 6, 242, 231, 90, 159, 18, 3, 187, 31, 140,
        162, 139, 15, 189, 230, 146, 230, 132, 151, 106, 231, 110, 235, 36, 45, 55, 213, 217, 30,
        122, 254, 109, 145, 189, 3, 146, 70, 187, 101, 117, 72, 127, 175, 3, 73, 108, 25, 61, 130,
        17, 133, 254, 252,
    ];
    let key = Key::from(&k);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(Logger::default())
            // TODO real bad
            .wrap(Cors::permissive())
            .wrap(IdentityMiddleware::default())
            .wrap(SessionMiddleware::new(
                storage::RedisActorSessionStore::new(redis_connection_string),
                key.clone(),
            ))
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
                    .service(algos::get_algos),
            )
            .service(
                web::scope("auth")
                    .service(auth::login)
                    .service(auth::logout),
            )
            .service(auth::callback) // TODO move to auth
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
