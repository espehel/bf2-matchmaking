use warp::Filter;

pub async fn run() {
    let api = filters::health();

    let routes = api.with(warp::log("events"));

    warp::serve(routes).run(([127, 0, 0, 1], 5006)).await;
}

mod filters {
    use super::handlers;
    use warp::Filter;

    pub fn health() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
        warp::path!("health")
            .and(warp::get())
            .and_then(handlers::health)
    }
}

mod handlers {
    use super::models::{Health, HealthStatus};
    use std::convert::Infallible;

    pub async fn health() -> Result<impl warp::Reply, Infallible> {
        Ok(warp::reply::json(&Health {
            http: HealthStatus::OK,
        }))
    }
}

mod models {
    use serde::Serialize;

    #[derive(Serialize, Clone)]
    pub enum HealthStatus {
        OK,
    }

    #[derive(Serialize, Clone)]
    pub struct Health {
        pub http: HealthStatus,
    }
}
