use crate::{actions, models, DbPool};
use actix_web::error::{ErrorForbidden, ErrorInternalServerError};
use actix_web::{get, post, web, Error};

#[get("/")]
pub(crate) async fn get_user_groups(
    pool: web::Data<DbPool>,
) -> Result<web::Json<Vec<models::UserGroup>>, Error> {
    let user_groups = web::block(move || {
        let mut conn = pool.get()?;
        actions::fetch_user_groups(&mut conn)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match user_groups {
        Ok(user_groups) => Ok(web::Json(user_groups)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}

#[post("/")]
pub(crate) async fn create_user_group(
    user: models::User,
    pool: web::Data<DbPool>,
    payload: web::Json<models::NewUserGroup>,
) -> Result<web::Json<models::UserGroup>, Error> {
    match user.role {
        models::UserRole::Admin => (),
        _ => return Err(ErrorForbidden("not authorized")),
    }

    let user_group = web::block(move || {
        let mut conn = pool.get()?;
        actions::insert_new_user_group(&mut conn, payload.into_inner())
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match user_group {
        Ok(user_group) => Ok(web::Json(user_group)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}

#[get("/attach/{user_group_id}/")]
pub(crate) async fn attach_to_user_group(
    user: models::User,
    pool: web::Data<DbPool>,
    user_group_id: web::Path<i32>,
) -> Result<web::Json<models::User>, Error> {
    let user = web::block(move || {
        let mut conn = pool.get()?;
        actions::attach_user_to_user_group(&mut conn, user.id, user_group_id.into_inner())
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match user {
        Ok(user) => Ok(web::Json(user)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}
