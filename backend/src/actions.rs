use diesel::prelude::*;
use diesel::upsert::excluded;

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
    new_name: String,
) -> Result<models::User, DbError> {
    // It is common when using Diesel with Actix Web to import schema-related
    // modules inside a function's scope (rather than the normal module's scope)
    // to prevent import collisions and namespace pollution.
    use crate::schema::users::dsl::*;

    let new_user = models::User {
        id: uid,
        avatar_url: new_avatar_url,
        name: new_name,
        role: models::UserRole::User,
    };

    diesel::insert_into(users)
        .values(&new_user)
        .on_conflict(id)
        .do_update()
        .set((avatar_url.eq(excluded(avatar_url)), name.eq(excluded(name))))
        .execute(conn)?;

    Ok(new_user)
}

pub fn insert_new_algo(conn: &mut PgConnection, new_algo: models::NewAlgo) -> Result<i32, DbError> {
    use crate::schema::algos::dsl::*;

    let k = diesel::insert_into(algos)
        .values(new_algo)
        .on_conflict(id)
        .do_nothing()
        .get_result::<models::Algo>(conn)?;

    Ok(k.id)
}

pub fn find_all_algos(conn: &mut PgConnection) -> Result<Vec<models::Algo>, DbError> {
    use crate::schema::algos::dsl::*;

    let algos2 = algos.limit(100).load::<models::Algo>(conn)?;

    Ok(algos2)
}

pub fn get_algo_file(conn: &mut PgConnection, algo_id: i32) -> Result<Vec<u8>, DbError> {
    use crate::schema::algos::dsl::*;

    let algo_file = algos
        .filter(id.eq(algo_id))
        .select(file)
        .first::<Vec<u8>>(conn)?;

    Ok(algo_file)
}

pub fn find_all_categories(conn: &mut PgConnection) -> Result<Vec<models::Category>, DbError> {
    use crate::schema::categories::dsl::*;

    let categories2 = categories.limit(100).load::<models::Category>(conn)?;

    Ok(categories2)
}

pub fn insert_new_category(
    conn: &mut PgConnection,
    new_category: models::NewCategory,
) -> Result<models::Category, DbError> {
    use crate::schema::categories::dsl::*;

    let created_category = diesel::insert_into(categories)
        .values(&new_category)
        .on_conflict(id)
        .do_update()
        .set((
            name.eq(excluded(name)),
            description.eq(excluded(description)),
            description_short.eq(excluded(description_short)),
            game_config.eq(excluded(game_config)),
            max_points.eq(excluded(max_points)),
            icon.eq(excluded(icon)),
        ))
        .get_result::<models::Category>(conn)?;

    Ok(created_category)
}
