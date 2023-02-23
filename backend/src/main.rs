#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_identity::IdentityMiddleware;
use actix_session::{storage, SessionMiddleware};
use actix_web::cookie::Key;
use actix_web::middleware::{Logger, NormalizePath, TrailingSlash};
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use std::env;

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
mod utils;

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
