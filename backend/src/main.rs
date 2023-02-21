#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_identity::{Identity, IdentityMiddleware};
use actix_session::storage::SessionStore;
use actix_session::{storage, SessionMiddleware};
use actix_web::cookie::Key;
use actix_web::dev::Payload;
use actix_web::error::{ErrorForbidden, ErrorUnauthorized};
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
mod models;
mod schema;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Info {
    redirect_url: String,
}

#[derive(Deserialize, Serialize)]
struct CallbackInfo {
    code: String,
    state: String,
}

#[derive(Debug, Clone, Hash, Eq, PartialEq, Serialize, Deserialize)]
#[non_exhaustive]
pub struct GhUser {
    pub login: String,
    pub id: UserId,
    pub node_id: String,
    pub avatar_url: Url,
    pub gravatar_id: String,
    pub url: Url,
    pub html_url: Url,
    pub followers_url: Url,
    pub following_url: Url,
    pub gists_url: Url,
    pub starred_url: Url,
    pub subscriptions_url: Url,
    pub organizations_url: Url,
    pub repos_url: Url,
    pub events_url: Url,
    pub received_events_url: Url,
    pub r#type: String,
    pub site_admin: bool,
    pub bio: String,
    pub name: String,
}

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

#[get("/callback")]
async fn callback(
    pool: web::Data<DbPool>,
    callback_info: web::Query<CallbackInfo>,
    http_request: HttpRequest,
) -> impl Responder {
    println!("code: {}", callback_info.code);
    println!("state: {}", callback_info.state);
    let c = &callback_info.code;
    let s = &callback_info.state;
    let code = AuthorizationCode::new(c.to_string());
    let state = CsrfToken::new(s.to_string());

    let client = BasicClient::new(
        ClientId::new(env::var("GH_CLIENT_ID").unwrap()),
        Some(ClientSecret::new(env::var("GH_CLIENT_SECRET").unwrap())),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    );
    let token_result = client
        .exchange_code(code)
        // .set_pkce_verifier(PkceCodeVerifier::new(s.to_string()))
        .request_async(async_http_client)
        .await;

    if let Ok(token) = token_result {
        // NB: Github returns a single comma-separated "scope" parameter instead of multiple
        // space-separated scopes. Github-specific clients can parse this scope into
        // multiple scopes by splitting at the commas. Note that it's not safe for the
        // library to do this by default because RFC 6749 allows scopes to contain commas.
        // let scopes = if let Some(scopes_vec) = token.scopes() {
        //     scopes_vec
        //         .iter()
        //         .map(|comma_separated| comma_separated.split(','))
        //         .flatten()
        //         .collect::<Vec<_>>()
        // } else {
        //     Vec::new()
        // };
        println!(
            "Github returned the following scopes:\n{:?} {:?}\n",
            token.scopes(),
            token.access_token().secret(),
        );

        let octocrab = Octocrab::builder()
            .personal_token(token.access_token().secret().to_owned())
            .build()
            .unwrap();
        let user: GhUser = octocrab.get("/user", None::<&()>).await.unwrap();
        println!("user: {:?}", user);

        let id = user.id.to_string();
        let extensions = &http_request.extensions();
        Identity::login(extensions, id.clone()).expect("failed to log in");

        let user2 = models::User {
            id: id.clone(),
            avatar_url: String::from(user.avatar_url.to_string()),
            name: String::from(user.name.to_string()),
        };
        // use web::block to offload blocking Diesel code without blocking server thread
        let user = web::block(move || {
            let mut conn = pool.get()?;
            actions::insert_new_user(
                &mut conn,
                id.clone(),
                String::from(user.avatar_url.to_string()),
                String::from(user.name.to_string()),
            )
        })
        .await
        .unwrap();
        // sessions.write().unwrap().map.insert(id, user2.clone());
        println!("login user: {:?}", user2);
    }

    let redirect_url = env::var("APP_UI_ENDPOINT").unwrap();
    HttpResponse::TemporaryRedirect()
        .append_header(("Location", redirect_url))
        .finish()
}

#[get("/user")]
async fn get_user(user: models::User) -> Result<web::Json<models::User>, Error> {
    println!("Github returned the following user:\n{:?}\n", user);
    return Ok(web::Json(user));
}

#[get("/auth")]
async fn hello() -> Result<web::Json<Info>, Error> {
    // Create an OAuth2 client by specifying the client ID, client secret, authorization URL and
    // token URL.
    let client = BasicClient::new(
        ClientId::new(env::var("GH_CLIENT_ID").unwrap()),
        Some(ClientSecret::new(env::var("GH_CLIENT_SECRET").unwrap())),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    )
    // Set the URL the user will be redirected to after the authorization process.
    .set_redirect_uri(RedirectUrl::new(env::var("GH_REDIRECT_URI").unwrap()).unwrap());

    // Generate a PKCE challenge.
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Generate the full authorization URL.
    let (auth_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        // Set the desired scopes.
        .add_scope(Scope::new("public_repo".to_string()))
        .add_scope(Scope::new("user:email".to_string()))
        // Set the PKCE code challenge.
        .set_pkce_challenge(pkce_challenge)
        .url();

    // This is the URL you should redirect the user to, in order to trigger the authorization
    // process.
    println!("Browse to: {}", auth_url);
    println!("csrf_token: {}", csrf_token.secret());
    let obj = Info {
        redirect_url: auth_url.to_string(),
    };
    return Ok(web::Json(obj));
}

type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/");

fn run_migrations(
    connection: &mut impl MigrationHarness<Pg>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    // This will run the necessary migrations.
    //
    // See the documentation for `MigrationHarness` for
    // all available methods.
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let redis_connection_string = "redis:6379";

    let conn_spec = env::var("DATABASE_URL").expect("DATABASE_URL");
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
    println!("key: {:?}", key.clone().master());
    // let store = if !env::var("DOMAINS").unwrap().is_empty() {
    //     Box::new(storage::RedisActorSessionStore::new(
    //         redis_connection_string,
    //     )) as Box<dyn SessionStore>
    // } else {
    //     Box::new(storage::CookieSessionStore::default()) as Box<dyn SessionStore>
    // };
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            // .app_data(sessions.clone())
            // TODO real bad
            .wrap(Logger::default())
            .wrap(Cors::permissive())
            .wrap(IdentityMiddleware::default())
            .wrap(SessionMiddleware::new(
                storage::RedisActorSessionStore::new(redis_connection_string),
                key.clone(),
            ))
            .service(get_user)
            .service(hello)
            .service(callback)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
