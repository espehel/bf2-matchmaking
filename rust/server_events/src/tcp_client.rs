use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;

use std::error::Error;

pub async fn setup_connection() -> Result<(), Box<dyn Error>> {
    // Open a TCP stream to the socket address.
    //
    // Note that this is the Tokio TcpStream, which is fully async.
    let mut stream = TcpStream::connect("127.0.0.1:6142").await?;
    println!("created stream");

    let result = stream.write_all(b"hello world\n").await;
    println!("wrote to stream; success={:?}", result.is_ok());

    Ok(())
}
