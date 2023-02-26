// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "category_icon"))]
    pub struct CategoryIcon;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_role"))]
    pub struct UserRole;
}

diesel::table! {
    algo_version (id) {
        id -> Int4,
        algo_id -> Int4,
        version -> Varchar,
        file -> Bytea,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    algos (id) {
        id -> Int4,
        user_id -> Varchar,
        name -> Varchar,
        language -> Varchar,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::CategoryIcon;

    categories (id) {
        id -> Int4,
        name -> Varchar,
        description -> Varchar,
        description_short -> Varchar,
        game_config -> Jsonb,
        max_points -> Int4,
        icon -> CategoryIcon,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    user_groups (id) {
        id -> Int4,
        name -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UserRole;

    users (id) {
        id -> Varchar,
        avatar_url -> Varchar,
        name -> Varchar,
        role -> UserRole,
        user_group_id -> Nullable<Int4>,
    }
}

diesel::joinable!(algo_version -> algos (algo_id));
diesel::joinable!(algos -> users (user_id));
diesel::joinable!(users -> user_groups (user_group_id));

diesel::allow_tables_to_appear_in_same_query!(
    algo_version,
    algos,
    categories,
    user_groups,
    users,
);
