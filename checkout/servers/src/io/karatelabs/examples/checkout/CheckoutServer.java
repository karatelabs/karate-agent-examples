package io.karatelabs.examples.checkout;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * The checkout service — <b>the SUT, and it is a CONSUMER</b>: it cannot confirm an order without
 * calling the payments API, a service this team does not own.
 *
 * <p>That one fact is what this whole kit demonstrates. In the everyday loop the checkout team points
 * {@code PAYMENTS_URL} at their own {@code mock/payments-mock.feature} and works at full speed with no
 * external dependency; what keeps that loop honest is {@code contract.karate.js} — the paired run that
 * proves the mock can stand in for the real provider on every operation these flows exercise. The mock is
 * the velocity; the pair is the license for it.</p>
 *
 * <p>Endpoints: {@code POST /orders} totals the items (integer cents), authorizes the total against the
 * payments API, and records the order as {@code CONFIRMED} or {@code PAYMENT_DECLINED} — a declined
 * payment is a recorded business outcome, never a lost order. {@code GET /orders/{id}} reads one back,
 * payment reference included.</p>
 *
 * <p>The payments base URL is resolved, in order: the {@code payments.url} system property, the second
 * program argument, the {@code PAYMENTS_URL} environment variable — the ambient environment last, so an
 * inherited value can never outrank a URL passed on purpose. A checkout server with no
 * payments target refuses to start — a consumer with a hard dependency should say so at boot, not 500
 * on the first order.</p>
 *
 * <pre>
 * java -cp servers/classes io.karatelabs.examples.checkout.CheckoutServer 8080 http://localhost:8090
 * </pre>
 */
public class CheckoutServer {

    private final String paymentsUrl;
    private final HttpClient client = HttpClient.newHttpClient();
    private final Map<String, Map<String, Object>> orders = new LinkedHashMap<>();
    private final AtomicInteger orderSeq = new AtomicInteger();

    CheckoutServer(String paymentsUrl) {
        this.paymentsUrl = paymentsUrl;
    }

    // ------------------------------------------------------------------ the operations

    synchronized Reply createOrder(Map<String, Object> body) throws IOException, InterruptedException {
        if (!(body.get("items") instanceof List<?> items) || items.isEmpty()) {
            return badRequest("items", "items must be a non-empty array");
        }
        int totalCents = 0;
        for (Object o : items) {
            Integer qty = o instanceof Map<?, ?> item ? PaymentsServer.intOf(item.get("qty")) : null;
            Integer price = o instanceof Map<?, ?> item ? PaymentsServer.intOf(item.get("priceCents")) : null;
            if (qty == null || price == null || qty < 1 || price < 1) {
                return badRequest("items", "each item needs a positive integer qty and priceCents");
            }
            totalCents += qty * price;
        }
        if (!(body.get("card") instanceof Map<?, ?> card)) {
            return badRequest("card", "card is required");
        }
        // the outbound dependency call — the one line that makes this service a CONSUMER
        Map<String, Object> paymentRequest = new LinkedHashMap<>();
        paymentRequest.put("amount", totalCents);
        paymentRequest.put("currency", "USD");
        paymentRequest.put("card", card);
        HttpResponse<String> paymentResponse = client.send(HttpRequest.newBuilder()
                        .uri(URI.create(paymentsUrl + "/payments"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(Json.write(paymentRequest)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
        if (paymentResponse.statusCode() == 400) {
            Map<String, Object> refused = Json.parseObject(paymentResponse.body());
            return badRequest("card", "the payments provider refused the request: " + refused.get("error"));
        }
        if (paymentResponse.statusCode() != 201) {
            return new Reply(502, Map.of("error",
                    "the payments provider answered " + paymentResponse.statusCode() + " — order not placed"));
        }
        Map<String, Object> payment = Json.parseObject(paymentResponse.body());
        Map<String, Object> order = new LinkedHashMap<>();
        order.put("id", "ord-" + orderSeq.incrementAndGet());
        order.put("status", "approved".equals(payment.get("status")) ? "CONFIRMED" : "PAYMENT_DECLINED");
        order.put("totalCents", totalCents);
        order.put("paymentId", payment.get("id"));
        orders.put((String) order.get("id"), order);
        return new Reply(201, order);
    }

    synchronized Reply getOrder(String id) {
        Map<String, Object> order = orders.get(id);
        return order == null
                ? new Reply(404, Map.of("error", "no such order", "field", "id"))
                : new Reply(200, order);
    }

    private static Reply badRequest(String field, String message) {
        return new Reply(400, Map.of("error", message, "field", field));
    }

    record Reply(int status, Map<String, Object> body) {
    }

    // ------------------------------------------------------------------ http plumbing

    void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        Reply reply;
        try (InputStream in = exchange.getRequestBody()) {
            String body = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            Map<String, Object> json;
            try {
                json = body.isBlank() ? Map.of() : Json.parseObject(body);
            } catch (RuntimeException e) {
                json = null;
            }
            String[] seg = path.split("/");   // "", "orders", ("{id}")
            try {
                if (json == null) {
                    reply = badRequest("body", "request body is not JSON");
                } else if ("POST".equals(method) && seg.length == 2 && "orders".equals(seg[1])) {
                    reply = createOrder(json);
                } else if ("GET".equals(method) && seg.length == 3 && "orders".equals(seg[1])) {
                    reply = getOrder(seg[2]);
                } else {
                    reply = new Reply(404, Map.of("error", "no such operation: " + method + " " + path));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                reply = new Reply(502, Map.of("error", "payments call interrupted"));
            } catch (IOException e) {
                // the dependency is DOWN — a consumer surfaces that as its own honest failure mode
                reply = new Reply(502, Map.of("error",
                        "could not reach the payments provider at " + paymentsUrl + ": " + e.getMessage()));
            }
        }
        byte[] out = Json.write(reply.body()).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(reply.status(), out.length);
        try (var os = exchange.getResponseBody()) {
            os.write(out);
        }
    }

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        // precedence: system property > explicit argument > ambient environment — an inherited
        // PAYMENTS_URL must never silently outrank the URL the operator (or a test) passed on purpose
        String paymentsUrl = System.getProperty("payments.url");
        if ((paymentsUrl == null || paymentsUrl.isBlank()) && args.length > 1) {
            paymentsUrl = args[1];
        }
        if (paymentsUrl == null || paymentsUrl.isBlank()) {
            paymentsUrl = System.getenv("PAYMENTS_URL");
        }
        if (paymentsUrl == null || paymentsUrl.isBlank()) {
            System.err.println("ERROR: no payments target — set -Dpayments.url, PAYMENTS_URL, or pass it "
                    + "as the second argument. A checkout service without its payments dependency cannot "
                    + "take an order, so it refuses to start instead of failing later.");
            System.exit(1);
        }
        CheckoutServer app = new CheckoutServer(paymentsUrl.replaceAll("/$", ""));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", app::handle);
        server.start();
        System.out.println("checkout SUT listening on http://localhost:" + server.getAddress().getPort()
                + "  (payments dependency: " + app.paymentsUrl + ")");
        Thread.currentThread().join();
    }
}
