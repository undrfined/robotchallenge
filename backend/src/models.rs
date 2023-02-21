use diesel_derive_enum;
use serde::{Deserialize, Serialize};

use crate::schema::users;

#[derive(diesel_derive_enum::DbEnum, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ExistingTypePath = "crate::schema::sql_types::UserRole"]
pub enum UserRole {
    User,
    Admin,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub avatar_url: String,
    pub name: String,
    pub role: UserRole,
}

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct NewUser {
//     pub name: String,
// }
