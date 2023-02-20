use actix_cors::Cors;
use actix_identity::{Identity, IdentityMiddleware};
use actix_session::storage::SessionStore;
use actix_session::{storage, SessionMiddleware};
use actix_web::cookie::Key;
use actix_web::dev::Payload;
use actix_web::error::{ErrorForbidden, ErrorUnauthorized};
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

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Info {
    redirect_url: String,
}

#[derive(Deserialize, Serialize)]
struct UserInfo {
    avatar_url: String,
}
#[derive(Deserialize, Serialize)]
struct CallbackInfo {
    code: String,
    state: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
struct User {
    id: String,
    avatar_url: Option<String>,
    // last_name: Option<String>,
    // authorities: Scope,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Sessions {
    map: HashMap<String, User>,
}

impl FromRequest for User {
    // type Config = ();
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<User, Error>>>>;

    fn from_request(req: &HttpRequest, pl: &mut Payload) -> Self::Future {
        let fut = Identity::from_request(req, pl);
        let sessions: Option<&web::Data<RwLock<Sessions>>> = req.app_data();
        if sessions.is_none() {
            warn!("sessions is empty(none)!");
            return Box::pin(async { Err(ErrorUnauthorized("unauthorized")) });
        }
        let sessions = sessions.unwrap().clone();
        println!("sessions: {:?}", sessions);
        Box::pin(async move {
            let k = fut.await;

            if let Ok(identity) = k {
                println!("identity: {:?}", identity.id());
                if let Some(user) = sessions
                    .read()
                    .unwrap()
                    .map
                    .get(&identity.id().unwrap().to_string())
                    .map(|x| x.clone())
                {
                    return Ok(user);
                }
            } else {
                println!("identity fail");
            }

            Err(ErrorUnauthorized("unauthorized"))
        })
    }
}

#[get("/callback")]
async fn callback(
    callback_info: web::Query<CallbackInfo>,
    sessions: web::Data<RwLock<Sessions>>,
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
        let user = octocrab.current().user().await.unwrap();

        let id = user.id.to_string();
        let extensions = &http_request.extensions();
        Identity::login(extensions, id.clone()).expect("failed to log in");

        let user2 = User {
            id: id.clone(),
            avatar_url: Some(String::from(user.avatar_url.to_string())),
        };
        sessions.write().unwrap().map.insert(id, user2.clone());
        println!("login user: {:?}", user2);
    }

    let redirect_url = env::var("APP_UI_ENDPOINT").unwrap();
    HttpResponse::TemporaryRedirect()
        .append_header(("Location", redirect_url))
        .finish()
}

#[get("/user")]
async fn get_user(user: User) -> Result<web::Json<User>, Error> {
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let sessions = web::Data::new(RwLock::new(Sessions {
        map: HashMap::new(),
    }));

    let key = Key::generate();
    HttpServer::new(move || {
        App::new()
            .app_data(sessions.clone())
            // TODO real bad
            .wrap(Cors::permissive())
            .wrap(IdentityMiddleware::default())
            .wrap(SessionMiddleware::new(
                storage::CookieSessionStore::default(),
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
