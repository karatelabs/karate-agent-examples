
import io.karatelabs.http.HttpResponse;
import io.karatelabs.http.HttpServer;

/**
 * A tiny WebSocket echo server: whatever you send, it sends straight back — text or binary.
 */
public class EchoServer {

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8090;
        HttpServer server = HttpServer.start(port,
                req -> HttpResponse.notFound("ws only — connect to ws://localhost:" + port + "/echo"),
                null,
                (req, conn) -> {
                    conn.onMessage(conn::send);     // text echo
                    conn.onBinary(conn::sendBytes); // binary echo
                });
        System.out.println("ws echo server started on ws://localhost:" + server.getPort() + "/echo");
        Thread.currentThread().join();
    }

}
