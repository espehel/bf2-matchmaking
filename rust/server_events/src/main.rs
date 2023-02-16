use std::{env, result};

mod http_client;
mod http_server;

#[tokio::main]
async fn main() {
    if env::var_os("RUST_LOG").is_none() {
        // Set `RUST_LOG=events=debug` to see debug logs,
        // this only shows access logs.
        env::set_var("RUST_LOG", "events=info");
    }
    pretty_env_logger::init();

    let result = http_client::register().await;
    println!("{:#?}", result);
    http_server::run().await;
}
