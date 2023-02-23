use crate::{actions, models, DbPool};
use actix_identity::Identity;
use actix_web::dev::Payload;
use actix_web::error::ErrorUnauthorized;
use actix_web::{web, Error, FromRequest, HttpRequest};
use std::future::Future;
use std::pin::Pin;

impl FromRequest for models::User {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<models::User, Error>>>>;

    fn from_request(req: &HttpRequest, pl: &mut Payload) -> Self::Future {
        println!("from_request");
        let fut = Identity::from_request(req, pl);
        let pool: Option<&web::Data<DbPool>> = req.app_data();
        if pool.is_none() {
            return Box::pin(async { Err(ErrorUnauthorized("unauthorized")) });
        }

        let pool = pool.unwrap().clone();
        Box::pin(async move {
            let k = fut.await;

            if let Ok(identity) = k {
                println!("identity: {:?}", identity.id());
                let id = identity.id().unwrap().to_string();
                let user = web::block(move || {
                    let mut conn = pool.get()?;
                    actions::find_user_by_uid(&mut conn, id)
                })
                .await
                .map_err(|e| {
                    println!("Error: {}", e);
                    ErrorUnauthorized("unauthorized")
                })?;

                if let Ok(user) = user {
                    return match user {
                        Some(user) => Ok(user),
                        None => Err(ErrorUnauthorized("unauthorized")),
                    };
                }
            } else {
                println!("identity fail");
            }

            Err(ErrorUnauthorized("unauthorized"))
        })
    }
}
