use actix_web::{get, post, web, App, Error, HttpResponse, HttpServer, Responder};
use anyhow;
use dotenv::dotenv;
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge, RedirectUrl,
    Scope, TokenResponse, TokenUrl,
};
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use std::env;
use url::Url;

#[derive(Deserialize, Serialize)]
struct Info {
    username: String,
}

#[derive(Deserialize, Serialize)]
struct CallbackInfo {
    code: String,
    state: String,
}

#[derive(Deserialize, Serialize)]
struct Lol {
    avatarUrl: String,
    name: String,
}

#[get("/callback")]
async fn callback(callback_info: web::Query<CallbackInfo>) -> impl Responder {
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
        let url = format!(
            "https://undrfin.de/#avatarUrl={}",
            user.avatar_url.to_string()
        );
        println!("Github returned the following user:\n{:?}\n", user);

        return HttpResponse::TemporaryRedirect()
            .append_header(("Location", url))
            .finish();
    }

    HttpResponse::TemporaryRedirect()
        .append_header(("Location", "https://undrfin.de/#login"))
        .finish()
}

#[get("/api")]
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
    .set_redirect_uri(RedirectUrl::new("https://undrfin.de/api/callback".to_string()).unwrap());

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
        username: auth_url.to_string(),
    };
    return Ok(web::Json(obj));
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(callback)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
