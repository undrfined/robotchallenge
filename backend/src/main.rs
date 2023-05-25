#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_identity::IdentityMiddleware;
use actix_session::{storage, SessionMiddleware};
use actix_web::cookie::Key;
use actix_web::middleware::{Logger, NormalizePath, TrailingSlash};
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;

use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

mod actions;
mod algos;
mod auth;
mod categories;
mod db;
mod models;
mod schema;
mod tests;
mod user_groups;
mod users;
mod utils;

type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    std::env::set_var("RUST_LOG", "actix_web=trace");
    env_logger::init();

    let redis_connection_string = "redis:6379";

    let (pool, s, s2) = db::init_db();
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
            .service(auth::callback) // TODO move to auth
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
