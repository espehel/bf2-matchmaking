pub async fn register() -> Result<models::PostServerResponse, reqwest::Error> {
    println!("sending request");

    let new_server = models::PostServerRequest {
        server_name: "Mock server".into(),
        ip: "1.2.3.4".into(),
    };

    let registered_server: models::PostServerResponse = reqwest::Client::new()
        .post("http://localhost:5002/servers")
        .json(&new_server)
        .send()
        .await?
        .json()
        .await?;

    Ok(registered_server)
}

mod models {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize)]
    pub struct PostServerRequest {
        #[serde(rename = "serverName")]
        pub server_name: String,
        pub ip: String,
    }

    #[derive(Debug, Deserialize)]
    pub struct PostServerResponse {
        pub ip: String,
        pub name: String,
        pub updated_at: String,
        pub port: String,
    }
}
