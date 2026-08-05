package io.karatelabs.examples.insurance;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * The policy-api demo's <b>REST face</b> — the same quotes/policies/claims contract ({@code openapi.yaml})
 * that {@code mock/policy-mock.feature} serves, implemented a second time, by hand, in Java.
 *
 * <h2>Why a second implementation exists</h2>
 *
 * <p>The kit's REST checks run against a karate mock. That proves the suite green; it cannot prove the mock
 * is a faithful stand-in for a real service, because the only thing it was ever compared against was
 * itself. This class is the other side of that comparison: it shares the rate book with {@link RatingServer}
 * (one premium function, so the two protocols cannot drift apart) and shares nothing else — its own store,
 * its own identifiers, its own JSON, its own HTTP stack. Point a paired run's {@code provider} at it and the
 * differences that come back are <b>drift between two independent implementations of one contract</b>,
 * which is the only kind of difference worth grading.</p>
 *
 * <p>It is also what makes the top rung reachable at all: a paired run refuses to call the claim
 * <i>proven</i> while the provider leg answers with a {@code Karate-Mock} header, and nothing here sends
 * one. That is a deliberate property of this file, not an accident of it.</p>
 *
 * <h2>What it deliberately is and is not</h2>
 *
 * <p>It is an in-memory demo backend: no database, no auth, no persistence across a restart. <b>Start it
 * fresh for each paired run</b> — two runs against one long-lived instance compare a mock that starts empty
 * against a provider that does not, and a list endpoint then returns a different number of rows on each leg.
 * That is not a fidelity finding, and the pair's own {@code seeded} profile says as much.</p>
 *
 * <p>It rates only the states the rate book knows ({@code rulebooks/rating/calc.js} — CA · NY · FL · TX ·
 * WA), and refuses anything else with a 400 rather than inventing a territory factor. The rulebook is the
 * oracle for both implementations; neither may quietly extend it.</p>
 *
 * <pre>
 * java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080
 * </pre>
 */
public class PolicyServer {

    static final Logger logger = LoggerFactory.getLogger(PolicyServer.class);

    /** The territories the rate book prices — the same set the gRPC engine validates against. */
    static final List<String> RATED_STATES = List.of("CA", "NY", "FL", "TX", "WA");

    static final List<String> COVERAGES = List.of("LIABILITY", "COLLISION", "COMPREHENSIVE");

    private final Map<String, Map<String, Object>> quotes = new LinkedHashMap<>();
    private final Map<String, Map<String, Object>> policies = new LinkedHashMap<>();
    private final Map<String, Map<String, Object>> claims = new LinkedHashMap<>();
    // this implementation's own identifier scheme, deliberately NOT the mock's: two targets mint surrogate
    // keys their own way, and a paired run excuses that difference through a named ignore rule rather than
    // through both sides secretly agreeing on a counter
    private final AtomicInteger quoteSeq = new AtomicInteger();
    private final AtomicInteger policySeq = new AtomicInteger();
    private final AtomicInteger claimSeq = new AtomicInteger();

    // ------------------------------------------------------------------ the operations

    /** {@code POST /quotes} — price a coverage request off the rate book. */
    synchronized Reply createQuote(Map<String, Object> body) {
        String state = str(body.get("state"));
        String coverage = str(body.get("coverage"));
        Integer driverAge = integer(body.get("driverAge"));
        if (state == null || !RATED_STATES.contains(state)) {
            return badRequest("state", "state must be one of " + RATED_STATES);
        }
        if (coverage == null || !COVERAGES.contains(coverage)) {
            return badRequest("coverage", "coverage must be one of " + COVERAGES);
        }
        if (driverAge == null || driverAge < 18 || driverAge > 80) {
            return badRequest("driverAge", "driverAge must be between 18 and 80");
        }
        Object claimsFlag = body.get("priorClaims");
        if (claimsFlag != null && !(claimsFlag instanceof Boolean)) {
            // `"true"` is not true. It reads as true to a JS mock and as false here, which is the worst
            // shape a disagreement can take: both targets answer 201 and quote a different premium.
            return badRequest("priorClaims", "priorClaims must be a boolean");
        }
        boolean priorClaims = Boolean.TRUE.equals(claimsFlag);
        Coverage line = Coverage.valueOf(coverage);
        int monthly = RatingServer.premium(line, driverAge, priorClaims, state);
        String id = "q-" + quoteSeq.incrementAndGet();
        Map<String, Object> quote = new LinkedHashMap<>();
        quote.put("id", id);
        quote.put("policyClass", RatingServer.policyClass(driverAge, priorClaims));
        quote.put("monthlyPremium", monthly);
        quote.put("currency", "USD");
        Map<String, Object> stored = new LinkedHashMap<>(quote);
        stored.put("state", state);
        quotes.put(id, stored);
        return new Reply(201, quote);
    }

    /** {@code POST /policies} — bind a policy from a quote this service actually issued. */
    synchronized Reply bindPolicy(Map<String, Object> body) {
        String quoteId = str(body.get("quoteId"));
        String holder = str(body.get("holder"));
        if (quoteId == null) {
            return badRequest("quoteId", "quoteId is required");
        }
        if (holder == null) {
            return badRequest("holder", "holder is required");
        }
        Map<String, Object> quote = quotes.get(quoteId);
        if (quote == null) {
            // a policy carries the price of the quote it was bound from, so an unknown quote is not
            // something to bind at a made-up premium — it is an invalid binding request (the 400 the
            // contract declares)
            return badRequest("quoteId", "no such quote: " + quoteId);
        }
        String id = "p-" + policySeq.incrementAndGet();
        Map<String, Object> policy = new LinkedHashMap<>();
        policy.put("id", id);
        policy.put("quoteId", quoteId);
        policy.put("holder", holder);
        policy.put("state", quote.get("state"));
        policy.put("monthlyPremium", quote.get("monthlyPremium"));
        policy.put("status", "BOUND");
        policies.put(id, policy);
        return new Reply(201, policy);
    }

    /**
     * {@code GET /policies} — every bound policy, optionally filtered by rating territory.
     *
     * <p>Hands out COPIES. The stored maps are mutable and {@link #cancelPolicy} edits one in place, so
     * returning them let a response be serialized while another request rewrote it. Harmless while every
     * exchange runs on the JDK server's single dispatcher thread, and a live trap the moment anyone gives
     * this server an executor — which is the first thing a reader of a demo backend does.</p>
     */
    synchronized Reply listPolicies(String stateFilter) {
        List<Object> out = new ArrayList<>();
        for (Map<String, Object> policy : policies.values()) {
            if (stateFilter == null || stateFilter.equals(policy.get("state"))) {
                out.add(new LinkedHashMap<>(policy));
            }
        }
        return new Reply(200, out);
    }

    /** {@code GET /policies/{id}}. */
    synchronized Reply getPolicy(String id) {
        Map<String, Object> policy = policies.get(id);
        return policy == null ? notFound("no such policy", id) : new Reply(200, new LinkedHashMap<>(policy));
    }

    /** {@code DELETE /policies/{id}} — a cancelled policy stays readable, with its status moved. */
    synchronized Reply cancelPolicy(String id) {
        Map<String, Object> policy = policies.get(id);
        if (policy == null) {
            return notFound("no such policy", id);
        }
        policy.put("status", "CANCELLED");
        return new Reply(204, null);
    }

    /** {@code POST /claims} — file a claim against a policy this service actually bound. */
    synchronized Reply fileClaim(Map<String, Object> body) {
        String policyId = str(body.get("policyId"));
        Integer amount = integer(body.get("amount"));
        if (policyId == null) {
            return badRequest("policyId", "policyId is required");
        }
        if (amount == null || amount < 1) {
            return badRequest("amount", "amount must be a positive integer");
        }
        if (!policies.containsKey(policyId)) {
            return badRequest("policyId", "no such policy: " + policyId);
        }
        String id = "c-" + claimSeq.incrementAndGet();
        Map<String, Object> claim = new LinkedHashMap<>();
        claim.put("id", id);
        claim.put("policyId", policyId);
        claim.put("amount", amount);
        claim.put("status", "OPEN");
        claims.put(id, claim);
        return new Reply(201, claim);
    }

    /** {@code GET /claims/{id}}. */
    synchronized Reply getClaim(String id) {
        Map<String, Object> claim = claims.get(id);
        return claim == null ? notFound("no such claim", id) : new Reply(200, claim);
    }

    // ------------------------------------------------------------------ routing

    /** One reply: the status, and the body to serialize (null = no body, for the 204). */
    record Reply(int status, Object body) {
    }

    // `error` first, then the detail — and a LinkedHashMap because `Map.of` iterates in a per-JVM salted
    // order, so the same 404 came out with its two keys swapped between restarts. Nothing compares response
    // bodies textually today, but a demo backend that cannot serialize the same body twice is a bad example.
    static Reply badRequest(String field, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", message);
        body.put("field", field);
        return new Reply(400, body);
    }

    static Reply notFound(String error, String id) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("id", id);
        return new Reply(404, body);
    }

    Reply route(String method, String path, String query, String body) {
        List<String> segments = new ArrayList<>();
        for (String s : path.split("/")) {
            if (!s.isEmpty()) {
                segments.add(s);
            }
        }
        Map<String, Object> json;
        try {
            json = body == null || body.isBlank() ? Map.of() : Json.parseObject(body);
        } catch (RuntimeException e) {
            // The one place the two implementations agree on the STATUS and not on the words: each parses
            // JSON with its own parser, and a body neither can read is outside what openapi.yaml describes
            // (its 400 is about invalid rating inputs, not about bytes that are not JSON). Deliberate, and
            // deliberately not exercised by the suite — an agreement we cannot honestly claim, we do not.
            return new Reply(400, Map.of("error", "malformed JSON body: " + e.getMessage()));
        }
        if (segments.size() == 1 && segments.get(0).equals("quotes") && method.equals("POST")) {
            return createQuote(json);
        }
        if (segments.size() == 1 && segments.get(0).equals("policies")) {
            if (method.equals("POST")) {
                return bindPolicy(json);
            }
            if (method.equals("GET")) {
                return listPolicies(param(query, "state"));
            }
        }
        if (segments.size() == 2 && segments.get(0).equals("policies")) {
            if (method.equals("GET")) {
                return getPolicy(segments.get(1));
            }
            if (method.equals("DELETE")) {
                return cancelPolicy(segments.get(1));
            }
        }
        if (segments.size() == 1 && segments.get(0).equals("claims") && method.equals("POST")) {
            return fileClaim(json);
        }
        if (segments.size() == 2 && segments.get(0).equals("claims") && method.equals("GET")) {
            return getClaim(segments.get(1));
        }
        return new Reply(404, Map.of("error", "Unknown endpoint"));
    }

    private void handle(HttpExchange exchange) throws IOException {
        Reply reply;
        try (InputStream in = exchange.getRequestBody()) {
            String body = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            reply = route(exchange.getRequestMethod(), exchange.getRequestURI().getPath(),
                    exchange.getRequestURI().getRawQuery(), body);
        } catch (RuntimeException e) {
            logger.warn("policy REST error", e);
            reply = new Reply(500, Map.of("error", String.valueOf(e.getMessage())));
        }
        byte[] out = reply.body() == null
                ? new byte[0] : Json.write(reply.body()).getBytes(StandardCharsets.UTF_8);
        if (out.length > 0) {
            exchange.getResponseHeaders().add("Content-Type", "application/json");
        }
        // a 204 carries no body, and -1 is how this server says "none" (0 would mean chunked-forever)
        exchange.sendResponseHeaders(reply.status(), out.length == 0 ? -1 : out.length);
        try (var os = exchange.getResponseBody()) {
            os.write(out);
        }
    }

    /**
     * One query parameter, decoded ONCE — off the RAW query string, because
     * {@code URI.getQuery()} has already decoded it and decoding that again turns a literal {@code %43}
     * (sent as {@code %2543}) into {@code C} and a literal {@code +} into a space. A blank value means the
     * parameter was not really given.
     */
    private static String param(String rawQuery, String name) {
        if (rawQuery == null) {
            return null;
        }
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(name)) {
                String value = java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
                return value.isBlank() ? null : value;
            }
        }
        return null;
    }

    /**
     * A string field, and <b>only</b> a string: the contract types these as strings, so a JSON number or
     * object arriving where a holder's name belongs is a bad request rather than something to stringify.
     * Coercing it made this server disagree with the mock over the same body, which is the one thing a
     * second implementation of a contract may not do quietly.
     */
    private static String str(Object o) {
        return o instanceof String s && !s.isBlank() ? s : null;
    }

    /**
     * An integer field, and only an integer: {@code 40} yes, {@code "40"} no, {@code 40.5} no. The old
     * {@code Number#intValue()} silently truncated {@code 80.5} to a valid age and wrapped a value past
     * {@code Integer.MAX_VALUE} into one — both of which a strict reader (and the mock) refuses.
     */
    private static Integer integer(Object o) {
        if (o instanceof Integer i) {
            return i;
        }
        if (o instanceof Long l) {
            return l == l.intValue() ? l.intValue() : null;
        }
        return null;
    }

    // ------------------------------------------------------------------ lifecycle

    public static HttpServer start(int port) throws IOException {
        PolicyServer api = new PolicyServer();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", api::handle);
        server.start();
        logger.debug("policy REST server started on port: {}", server.getAddress().getPort());
        return server;
    }

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        HttpServer server = start(port);
        logger.info("policy API (REST) listening on :{}", server.getAddress().getPort());
        Thread.currentThread().join();
    }
}
