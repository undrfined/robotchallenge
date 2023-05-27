use crate::{actions, models, DbPool};
use actix_web::error::{ErrorInternalServerError, ErrorNotFound};
use actix_web::{get, web, Error};

#[get("/")]
pub(crate) async fn get_user(user: models::User) -> Result<web::Json<models::User>, Error> {
    Ok(web::Json(user))
}

#[get("/{id}/")]
pub(crate) async fn get_user_by_id(
    path: web::Path<String>,
    pool: web::Data<DbPool>,
) -> Result<web::Json<models::User>, Error> {
    let user_id = path.into_inner();
    let user = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_user_by_uid(&mut conn, user_id)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError)?;

    match user {
        Some(u) => Ok(web::Json(u)),
        None => Err(ErrorNotFound("User not found")),
    }
}
