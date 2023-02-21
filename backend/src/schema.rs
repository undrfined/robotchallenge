// @generated automatically by Diesel CLI.

diesel::table! {
    users (id) {
        id -> Varchar,
        avatar_url -> Varchar,
        name -> Varchar,
    }
}
