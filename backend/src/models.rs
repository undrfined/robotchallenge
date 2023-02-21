use serde::{Deserialize, Serialize};

use crate::schema::users;

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub avatar_url: String,
    pub name: String,
}

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct NewUser {
//     pub name: String,
// }
