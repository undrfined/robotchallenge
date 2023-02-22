use chrono;
use diesel_derive_enum;
use serde::{Deserialize, Serialize};

use crate::schema::algos;
use crate::schema::categories;
use crate::schema::users;

#[derive(diesel_derive_enum::DbEnum, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[ExistingTypePath = "crate::schema::sql_types::UserRole"]
pub enum UserRole {
    User,
    Admin,
}

#[derive(diesel_derive_enum::DbEnum, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
#[ExistingTypePath = "crate::schema::sql_types::CategoryIcon"]
pub enum CategoryIcon {
    Lightning,
    Robot,
    Diamond,
    Crown,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable, Identifiable)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub avatar_url: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable, Identifiable)]
#[diesel(belongs_to(User))]
#[serde(rename_all = "camelCase")]
pub struct Algo {
    pub id: i32,
    pub user_id: String,
    pub file: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable, Identifiable)]
#[serde(rename_all = "camelCase")]
#[table_name = "categories"]
pub struct Category {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub description_short: String,
    pub game_config: serde_json::Value,
    pub max_points: i32,
    pub icon: CategoryIcon,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
#[serde(rename_all = "camelCase")]
#[table_name = "categories"]
pub struct NewCategory {
    pub name: String,
    pub description: String,
    pub description_short: String,
    pub game_config: serde_json::Value,
    pub max_points: i32,
    pub icon: CategoryIcon,
}
