use crate::{actions, models, DbPool};
use actix_multipart::Multipart;
use actix_web::error::ErrorInternalServerError;
use actix_web::{get, post, web, Error};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AlgoJsonResult {
    id: i32,
}

#[get("/")]
pub(crate) async fn get_algos(
    pool: web::Data<DbPool>,
) -> Result<web::Json<Vec<models::Algo>>, Error> {
    let algos = web::block(move || {
        let mut conn = pool.get()?;
        actions::find_all_algos(&mut conn)
    })
    .await
    .map_err(ErrorInternalServerError)?
    .map_err(ErrorInternalServerError);

    match algos {
        Ok(algos) => Ok(web::Json(algos)),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}

#[post("/")]
pub(crate) async fn create_algo(
    user: models::User,
    pool: web::Data<DbPool>,
    mut payload: Multipart,
) -> Result<web::Json<AlgoJsonResult>, Error> {
    use actix_web::{middleware, web, App, Error, HttpResponse, HttpServer};
    use futures::{StreamExt, TryStreamExt};

    if let Ok(Some(mut field)) = payload.try_next().await {
        let content_type = field.content_disposition();
        let filename = content_type.get_filename().unwrap();
        println!("File name: {:?}, type {:?}", filename, content_type);

        // Get data to Vec<u8>
        let mut data = web::BytesMut::new();
        while let Some(chunk) = field.next().await {
            data.extend_from_slice(&chunk?);
        }

        let uid = user.id.clone();
        let data = data.to_vec();
        let fid = web::block(move || {
            let mut conn = pool.get()?;
            actions::insert_new_algo(&mut conn, uid, data)
        })
        .await
        .map_err(ErrorInternalServerError)?
        .map_err(ErrorInternalServerError)
        .unwrap();

        return Ok(web::Json(AlgoJsonResult { id: fid }));
    }

    Err(ErrorInternalServerError("algo not found"))
}
