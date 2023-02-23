use crate::{actions, models, DbPool};
use actix_web::error::{ErrorForbidden, ErrorInternalServerError};
use actix_web::{get, post, web, Error};

#[get("/")]
pub(crate) async fn get_categories(
    pool: web::Data<DbPool>,
) -> Result<web::Json<Vec<models::Category>>, Error> {
    let categories = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_all_categories(&mut conn)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match categories {
        Ok(categories) => Ok(web::Json(categories)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}

#[post("/")]
pub(crate) async fn create_category(
    user: models::User,
    pool: web::Data<DbPool>,
    payload: web::Json<models::NewCategory>,
) -> Result<web::Json<models::Category>, Error> {
    match user.role {
        models::UserRole::Admin => (),
        _ => return Err(ErrorForbidden("not authorized")),
    }

    let category = web::block(move || {
        let mut conn = pool.get()?;
        actions::insert_new_category(&mut conn, payload.into_inner())
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match category {
        Ok(category) => Ok(web::Json(category)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}
