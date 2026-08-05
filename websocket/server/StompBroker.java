
import io.karatelabs.common.Json;
import io.karatelabs.http.HttpResponse;
import io.karatelabs.http.HttpServer;
import io.karatelabs.http.WsConnection;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A deliberately tiny STOMP-over-websocket server — enough to exercise the {@link StompCodec}
 * against a real STOMP flow WITHOUT pulling in Spring Boot (the shape the spring-guides
 * "messaging-stomp-websocket" demo used). Reuses core's {@link HttpServer} ws transport.
 *
 * <p>Flow modelled: {@code CONNECT}→{@code CONNECTED}; {@code SUBSCRIBE} tracked; a {@code SEND} to
 * {@code /app/hello} with body <code>{name}</code> fans out a {@code MESSAGE} to every
 * {@code /topic/greetings} subscriber with body <code>{content:"Hello, &lt;name&gt;!"}</code>;
 * {@code DISCONNECT} with a {@code receipt} header replies {@code RECEIPT}. Not a full broker — no
 * transactions/acks/heart-beats beyond the echo of the negotiated values.</p>
 */
public class StompBroker {

    private static final String GREETINGS = "/topic/greetings";
    private static final String APP_HELLO = "/app/hello";
    private static final char NUL = '\0';

    private record Subscription(WsConnection conn, String destination, String id) {
    }

    private final List<Subscription> subscriptions = new CopyOnWriteArrayList<>();
    private final AtomicLong messageIds = new AtomicLong();
    private HttpServer server;

    public int start() {
        return start(0);
    }

    public int start(int port) {
        server = HttpServer.start(port,
                req -> HttpResponse.notFound("stomp ws only"),
                null,
                (req, conn) -> conn.onMessage(text -> handle(conn, text)));
        return server.getPort();
    }

    public String url() {
        return "ws://localhost:" + server.getPort() + "/stomp";
    }

    public void stop() {
        if (server != null) {
            server.stopAsync();
        }
    }

    private void handle(WsConnection conn, String wire) {
        Frame frame = Frame.parse(wire);
        switch (frame.command) {
            case "CONNECT", "STOMP" -> conn.send(new Frame("CONNECTED",
                    Map.of("version", "1.2", "heart-beat", "0,0"), null).toWire());
            case "SUBSCRIBE" -> subscriptions.add(new Subscription(conn,
                    frame.headers.get("destination"), frame.headers.get("id")));
            case "SEND" -> {
                if (APP_HELLO.equals(frame.headers.get("destination"))) {
                    String name = "world";
                    if (frame.body != null && !frame.body.isBlank()) {
                        Object parsed = Json.of(frame.body).value();
                        if (parsed instanceof Map<?, ?> m && m.get("name") != null) {
                            name = m.get("name").toString();
                        }
                    }
                    broadcastGreeting(name);
                }
            }
            case "DISCONNECT" -> {
                String receipt = frame.headers.get("receipt");
                if (receipt != null) {
                    conn.send(new Frame("RECEIPT", Map.of("receipt-id", receipt), null).toWire());
                }
            }
            default -> {
                // ignore unknown commands
            }
        }
    }

    private void broadcastGreeting(String name) {
        String body = Json.of(Map.of("content", "Hello, " + name + "!")).toString();
        for (Subscription sub : subscriptions) {
            if (GREETINGS.equals(sub.destination) && sub.conn.isOpen()) {
                Map<String, String> headers = new LinkedHashMap<>();
                headers.put("subscription", sub.id);
                headers.put("destination", GREETINGS);
                headers.put("message-id", "msg-" + messageIds.incrementAndGet());
                headers.put("content-type", "application/json");
                sub.conn.send(new Frame("MESSAGE", headers, body).toWire());
            }
        }
    }

    /** A STOMP frame: COMMAND line, header lines (k:v), blank line, optional body, NUL terminator. */
    private record Frame(String command, Map<String, String> headers, String body) {

        String toWire() {
            StringBuilder sb = new StringBuilder();
            sb.append(command).append('\n');
            headers.forEach((k, v) -> sb.append(k).append(':').append(v).append('\n'));
            sb.append('\n');
            if (body != null) {
                sb.append(body);
            }
            sb.append(NUL);
            return sb.toString();
        }

        static Frame parse(String wire) {
            String trimmed = wire.endsWith(String.valueOf(NUL)) ? wire.substring(0, wire.length() - 1) : wire;
            String[] lines = trimmed.split("\n", -1);
            String command = lines.length > 0 ? lines[0] : "";
            Map<String, String> headers = new LinkedHashMap<>();
            int i = 1;
            for (; i < lines.length; i++) {
                if (lines[i].isEmpty()) {
                    i++;
                    break;
                }
                int pos = lines[i].indexOf(':');
                if (pos > -1) {
                    headers.put(lines[i].substring(0, pos), lines[i].substring(pos + 1));
                }
            }
            StringBuilder body = new StringBuilder();
            for (; i < lines.length; i++) {
                if (body.length() > 0) {
                    body.append('\n');
                }
                body.append(lines[i]);
            }
            return new Frame(command, headers, body.length() == 0 ? null : body.toString());
        }
    }


    public static void main(String[] args) throws Exception {
        StompBroker broker = new StompBroker();
        int port = broker.start(args.length > 0 ? Integer.parseInt(args[0]) : 8091);
        System.out.println("stomp broker started on ws://localhost:" + port + "/stomp");
        Thread.currentThread().join();
    }

}
