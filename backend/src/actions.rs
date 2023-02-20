use diesel::prelude::*;

use crate::models;

type DbError = Box<dyn std::error::Error + Send + Sync>;

/// Run query using Diesel to find user by uid and return it.
pub fn find_user_by_uid(
    conn: &mut PgConnection,
    uid: String,
) -> Result<Option<models::User>, DbError> {
    use crate::schema::users::dsl::*;

    let user = users
        .filter(id.eq(uid))
        .first::<models::User>(conn)
        .optional()?;

    Ok(user)
}

pub fn insert_new_user(
    conn: &mut PgConnection,
    uid: String,
    new_avatar_url: String,
) -> Result<models::User, DbError> {
    // It is common when using Diesel with Actix Web to import schema-related
    // modules inside a function's scope (rather than the normal module's scope)
    // to prevent import collisions and namespace pollution.
    use crate::schema::users::dsl::*;

    let new_user = models::User {
        id: uid,
        avatar_url: new_avatar_url,
    };

    diesel::insert_into(users).values(&new_user).execute(conn)?;

    Ok(new_user)
}
