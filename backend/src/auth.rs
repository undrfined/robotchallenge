use crate::{actions, DbPool};
use actix_identity::Identity;
use actix_web::{get, web, Error, HttpMessage, HttpRequest, HttpResponse, Responder};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge, RedirectUrl,
    Scope, TokenResponse, TokenUrl,
};
use octocrab::models::UserId;
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use std::env;
use url::Url;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Info {
    redirect_url: String,
}

#[derive(Deserialize, Serialize)]
pub struct CallbackInfo {
    code: String,
    state: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OkJsonResult {
    ok: bool,
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
    pub bio: Option<String>,
    pub name: Option<String>,
}

#[get("/logout/")]
pub(crate) async fn logout(id: Identity) -> Result<web::Json<OkJsonResult>, Error> {
    Identity::logout(id);
    Ok(web::Json(OkJsonResult { ok: true }))
}

#[get("/callback/")]
pub(crate) async fn callback(
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

        // use web::block to offload blocking Diesel code without blocking server thread
        let user = web::block(move || {
            let mut conn = pool.get()?;
            actions::insert_new_user(
                &mut conn,
                id.clone(),
                String::from(user.avatar_url.to_string()),
                String::from(match user.name {
                    Some(name) => name,
                    None => user.login.to_string(),
                }),
            )
        })
        .await
        .unwrap();
        // sessions.write().unwrap().map.insert(id, user2.clone());
    }

    let redirect_url = env::var("APP_UI_ENDPOINT").unwrap();
    HttpResponse::TemporaryRedirect()
        .append_header(("Location", redirect_url))
        .finish()
}

#[get("/login/")]
pub(crate) async fn login() -> Result<web::Json<Info>, Error> {
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
    return Ok(web::Json(Info {
        redirect_url: auth_url.to_string(),
    }));
}
