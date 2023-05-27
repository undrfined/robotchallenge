use crate::DbPool;

use diesel::pg::Pg;
use diesel::r2d2::ConnectionManager;
use diesel::row::NamedRow;
use diesel::{r2d2, sql_query, Connection, PgConnection, RunQueryDsl};
use diesel_logger::LoggingConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

use std::env;
use std::sync::atomic::AtomicU32;
use url::Url;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

fn run_migrations(
    connection: &mut impl MigrationHarness<Pg>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

static TEST_DB_COUNTER: AtomicU32 = AtomicU32::new(0);

pub fn init_db() -> (DbPool, String, String) {
    let conn_spec = env::var("DATABASE_URL").expect("Please specify DATABASE_URL");

    let name = format!(
        "test_db_{}_{}",
        std::process::id(),
        TEST_DB_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst)
    );

    let url = if cfg!(test) {
        let mut conn = LoggingConnection::new(PgConnection::establish(&conn_spec).unwrap());
        sql_query(format!("CREATE DATABASE {};", name))
            .execute(&mut conn)
            .unwrap();

        let mut url = Url::parse(&conn_spec).unwrap();
        url.set_path(&name);
        url.to_string()
    } else {
        conn_spec
    };
    println!("Connecting to {}", url.clone());
    let manager = ConnectionManager::<PgConnection>::new(url.clone());
    let pool_size = match cfg!(test) {
        true => 1,
        false => 10,
    };
    let pool = r2d2::Pool::builder()
        .max_size(pool_size)
        .build(manager)
        .expect("Failed to create pool.");

    let mut conn = pool.get().unwrap();

    run_migrations(&mut conn);

    (pool, url, name)
}
