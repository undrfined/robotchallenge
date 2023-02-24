use crate::{actions, models, utils, DbPool};
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

        let data = data.to_vec();

        let fid = web::block(move || {
            let lib_info = utils::wasm_module::get_lib_info(&data).expect("failed to get lib info");

            let new_algo = models::NewAlgo {
                name: lib_info.name,
                file: data.clone(),
                user_id: user.id.clone(),
                version: lib_info.version,
                language: lib_info.language,
            };

            let mut conn = pool.get()?;
            actions::insert_new_algo(&mut conn, new_algo)
        })
        .await
        .map_err(ErrorInternalServerError)?
        .map_err(ErrorInternalServerError)
        .unwrap();

        return Ok(web::Json(AlgoJsonResult { id: fid }));
    }

    Err(ErrorInternalServerError("algo not found"))
}
