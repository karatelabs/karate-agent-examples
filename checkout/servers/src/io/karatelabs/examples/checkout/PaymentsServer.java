package io.karatelabs.examples.checkout;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * The "real" payments provider — the service the checkout team's mock stands in for, implemented
 * independently against the same {@code payments-api.yaml}.
 *
 * <h2>Why this exists</h2>
 *
 * <p>The checkout SUT depends on a payments API this team does not own. Day to day the team builds and
 * tests against {@code mock/payments-mock.feature}; this class is the other side of the comparison a
 * paired run makes ({@code contract.karate.js}): same contract, implemented twice, sharing the business
 * rules (the decline threshold, the network derivation) and nothing else — its own store, its own
 * identifier scheme, its own hand-rolled JSON, its own HTTP stack, and <b>no {@code Karate-Mock} header</b>
 * (a paired run reads the wire and refuses to call a run against one of our own mocks anything more than
 * a rehearsal).</p>
 *
 * <h2>The deliberate framing difference — kept, and documented</h2>
 *
 * <p>This implementation reports the card network in <b>lower case</b> ({@code "visa"}) where the mock
 * reports {@code "VISA"}. The suite never asserts on {@code network}, so both legs stay green — and the
 * paired run's response-layer comparison still reports the difference, as an {@code unassertedDivergence}:
 * a finding about the <i>suite</i> (too loose to see it), which is the one thing a green build cannot
 * tell you on its own. Do not "fix" this file to match the mock; it is the demo's teaching moment.</p>
 *
 * <p>In-memory, no auth, no persistence — start it fresh for each paired run. Amounts are integer cents; a body this server cannot parse is a 400, never a guess.</p>
 *
 * <pre>
 * java -cp servers/classes io.karatelabs.examples.checkout.PaymentsServer 8090
 * </pre>
 */
public class PaymentsServer {

    private final Map<String, Map<String, Object>> payments = new LinkedHashMap<>();
    private final Map<String, Map<String, Object>> refundsByPayment = new LinkedHashMap<>();
    // this implementation's own identifier scheme, deliberately NOT the mock's ('pay-1'): the contract
    // fixes the type, never the value, and the paired run excuses the difference through a named ignore rule
    private final AtomicInteger paySeq = new AtomicInteger(1000);
    private final AtomicInteger refSeq = new AtomicInteger(2000);

    // ------------------------------------------------------------------ the operations

    static boolean declined(int amountCents) {
        return amountCents > 50000;     // the shared business rule — both implementations agree
    }

    /** The contract says integer; the JSON reader hands back {@code Long} — strict, no doubles, no strings. */
    static Integer intOf(Object v) {
        if (v instanceof Integer i) {
            return i;
        }
        if (v instanceof Long l && l >= Integer.MIN_VALUE && l <= Integer.MAX_VALUE) {
            return (int) (long) l;
        }
        return null;
    }

    static String networkOf(String cardNumber) {
        // same derivation as the mock, DIFFERENT casing — the kept framing difference (class javadoc)
        return cardNumber.startsWith("4") ? "visa" : "mastercard";
    }

    synchronized Reply createPayment(Map<String, Object> body) {
        Integer cents = intOf(body.get("amount"));
        if (cents == null || cents < 1) {
            return badRequest("amount", "amount must be a positive integer (cents)");
        }
        if (!"USD".equals(body.get("currency"))) {
            return badRequest("currency", "currency must be USD");
        }
        if (!(body.get("card") instanceof Map<?, ?> card)) {
            return badRequest("card.number", "card.number is required");
        }
        if (!(card.get("number") instanceof String number) || number.isBlank()) {
            return badRequest("card.number", "card.number is required");
        }
        if (!(card.get("expiry") instanceof String expiry) || expiry.isBlank()) {
            return badRequest("card.expiry", "card.expiry is required");
        }
        Map<String, Object> payment = new LinkedHashMap<>();
        payment.put("id", "p-" + paySeq.incrementAndGet());
        payment.put("status", declined(cents) ? "declined" : "approved");
        payment.put("amount", cents);
        payment.put("currency", "USD");
        payment.put("network", networkOf(number));
        payments.put((String) payment.get("id"), payment);
        return new Reply(201, payment);
    }

    synchronized Reply getPayment(String id) {
        Map<String, Object> payment = payments.get(id);
        return payment == null ? notFound(id) : new Reply(200, payment);
    }

    synchronized Reply refundPayment(String id) {
        Map<String, Object> payment = payments.get(id);
        if (payment == null) {
            return notFound(id);
        }
        if (refundsByPayment.containsKey(id)) {
            return new Reply(409, Map.of("error", "payment already refunded", "field", "id"));
        }
        Map<String, Object> refund = new LinkedHashMap<>();
        refund.put("id", "r-" + refSeq.incrementAndGet());
        refund.put("paymentId", id);
        refund.put("status", "refunded");
        refundsByPayment.put(id, refund);
        payment.put("status", "refunded");
        return new Reply(201, refund);
    }

    private static Reply notFound(String id) {
        return new Reply(404, Map.of("error", "no such payment", "field", "id"));
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
                // each implementation parses JSON with its own parser: same STATUS as the mock, its own
                // words — bytes that are not JSON are outside what payments-api.yaml describes
                json = null;
            }
            String[] seg = path.split("/");   // "", "payments", "{id}", ("refund")
            if (json == null) {
                reply = badRequest("body", "request body is not JSON");
            } else if ("POST".equals(method) && seg.length == 2 && "payments".equals(seg[1])) {
                reply = createPayment(json);
            } else if ("GET".equals(method) && seg.length == 3 && "payments".equals(seg[1])) {
                reply = getPayment(seg[2]);
            } else if ("POST".equals(method) && seg.length == 4 && "payments".equals(seg[1]) && "refund".equals(seg[3])) {
                reply = refundPayment(seg[2]);
            } else {
                reply = new Reply(404, Map.of("error", "no such operation: " + method + " " + path));
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
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8090;
        PaymentsServer app = new PaymentsServer();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", app::handle);
        server.start();
        System.out.println("payments provider listening on http://localhost:" + server.getAddress().getPort());
        Thread.currentThread().join();
    }
}
