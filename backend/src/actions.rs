use diesel::prelude::*;
use diesel::result::Error::DatabaseError;
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
    new_role: Option<models::UserRole>,
) -> Result<models::User, DbError> {
    // It is common when using Diesel with Actix Web to import schema-related
    // modules inside a function's scope (rather than the normal module's scope)
    // to prevent import collisions and namespace pollution.
    use crate::schema::users::dsl::*;

    let new_user = models::User {
        id: uid,
        avatar_url: new_avatar_url,
        name: new_name,
        role: new_role.unwrap_or(models::UserRole::User),
        user_group_id: None,
    };

    diesel::insert_into(users)
        .values(&new_user)
        .on_conflict(id)
        .do_update()
        .set((avatar_url.eq(excluded(avatar_url)), name.eq(excluded(name))))
        .execute(conn)?;

    Ok(new_user)
}

pub fn get_algo_by_name(
    conn: &mut PgConnection,
    algo_user_id: String,
    algo_name: String,
) -> Result<models::Algo, DbError> {
    use crate::schema::algos::dsl::*;

    let algo = algos
        .filter(name.eq(algo_name))
        .filter(user_id.eq(algo_user_id))
        .first::<models::Algo>(conn)
        .optional()?
        .unwrap();

    Ok(algo)
}

pub fn insert_new_algo(
    conn: &mut PgConnection,
    new_algo: models::NewAlgo,
    new_algo_version: models::NewAlgoVersion,
) -> Result<(i32, i32), DbError> {
    let new_algo_id = {
        use crate::schema::algos::dsl::*;

        let result = diesel::insert_into(algos)
            .values(&new_algo)
            .returning(id)
            .get_result::<i32>(conn);

        match result {
            Ok(i) => i,
            Err(DatabaseError(UniqueViolation, info)) => {
                let k = get_algo_by_name(conn, new_algo.user_id, new_algo.name)?.id;
                println!("error ds: {:?} {:?}", info, k);
                k
            }
            Err(e) => return Err(Box::new(e)),
        }
    };

    println!("wow, inserted {:?}", new_algo_id);

    let algo_version_id = {
        use crate::schema::algo_version::dsl::*;

        diesel::insert_into(algo_version)
            .values((new_algo_version, algo_id.eq(new_algo_id)))
            .returning(id)
            .get_result(conn)?
    };

    println!("wow, inserted {:?} and {:?}", new_algo_id, algo_version_id);
    Ok((new_algo_id, algo_version_id))
}

pub fn find_all_algos(conn: &mut PgConnection) -> Result<Vec<models::Algo>, DbError> {
    use crate::schema::algos::dsl::*;

    let algos2 = algos.limit(100).load::<models::Algo>(conn)?;

    Ok(algos2)
}

pub fn find_algo_versions(
    conn: &mut PgConnection,
    new_algo_id: i32,
) -> Result<Vec<models::AlgoVersion>, DbError> {
    use crate::schema::algo_version::dsl::*;

    let algo_versions = algo_version
        .filter(algo_id.eq(new_algo_id))
        .limit(100)
        .load::<models::AlgoVersion>(conn)?;

    Ok(algo_versions)
}

pub fn find_algos(
    conn: &mut PgConnection,
    algo_versions: Vec<i32>,
) -> Result<Vec<models::AlgoVersion>, DbError> {
    use crate::schema::algo_version::dsl::*;

    let algo_versions = algo_version
        .filter(id.eq_any(algo_versions))
        .limit(100)
        .load::<models::AlgoVersion>(conn)?;

    Ok(algo_versions)
}

pub fn get_algo_file(conn: &mut PgConnection, algo_verion_id: i32) -> Result<Vec<u8>, DbError> {
    use crate::schema::algo_version::dsl::*;

    let algo_file = algo_version
        .filter(id.eq(algo_verion_id))
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
            deadline_at.eq(excluded(deadline_at)),
        ))
        .get_result::<models::Category>(conn)?;

    Ok(created_category)
}

pub fn insert_new_user_group(
    conn: &mut PgConnection,
    new_user_group: models::NewUserGroup,
) -> Result<models::UserGroup, DbError> {
    use crate::schema::user_groups::dsl::*;

    let created_user_group = diesel::insert_into(user_groups)
        .values(&new_user_group)
        .on_conflict(id)
        .do_update()
        .set((name.eq(excluded(name)),))
        .get_result::<models::UserGroup>(conn)?;

    Ok(created_user_group)
}

pub fn fetch_user_groups(conn: &mut PgConnection) -> Result<Vec<models::UserGroup>, DbError> {
    let user_groups = {
        use crate::schema::user_groups::dsl::*;

        user_groups.limit(100).load::<models::UserGroup>(conn)?
    };

    Ok(user_groups)
}

pub fn attach_user_to_user_group(
    conn: &mut PgConnection,
    user_id: String,
    new_user_group_id: i32,
) -> Result<models::User, DbError> {
    use crate::schema::users::dsl::*;

    let u = diesel::update(users)
        .filter(id.eq(user_id))
        .set(user_group_id.eq(new_user_group_id))
        .get_result::<models::User>(conn)?;

    Ok(u)
}
