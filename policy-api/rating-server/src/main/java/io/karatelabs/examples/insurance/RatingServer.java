package io.karatelabs.examples.insurance;

import com.google.protobuf.Any;
import com.google.rpc.BadRequest;
import com.google.rpc.ErrorInfo;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.protobuf.StatusProto;
import io.grpc.protobuf.services.ProtoReflectionServiceV1;
import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * The policy-api demo's RATING ENGINE — a tiny, deterministic gRPC premium calculator over a
 * {@code RateRequest}'s coverage line, driver age, prior-claims flag, and US state. It is the
 * always-on backend the demo's gRPC checks drive. All four RPC kinds are implemented:
 * <ul>
 *   <li>{@code Rate} (unary) — the quote; rejects an unsupported/blank state with INVALID_ARGUMENT and the
 *       gRPC rich-error model (a {@code google.rpc.BadRequest} field violation + an {@code ErrorInfo}) so a
 *       check can assert typed details, not just the coarse status code.</li>
 *   <li>{@code StreamQuotes} (server-streaming) — one quote per term option (monthly / semi-annual / annual).</li>
 *   <li>{@code BatchRate} (client-streaming) — aggregate a batch of requests into one blended premium.</li>
 *   <li>{@code Negotiate} (bidi) — a counter-offer per request.</li>
 * </ul>
 * Reflection is exposed so a client can connect with NO local .proto. Listens on :50052 by default.
 */
public class RatingServer extends RatingServiceGrpc.RatingServiceImplBase {

    static final Logger logger = LoggerFactory.getLogger(RatingServer.class);

    static final Set<String> SUPPORTED_STATES = Set.of("CA", "NY", "TX", "FL", "WA");

    /** Deterministic premium: a coverage base, an age loading, a prior-claims surcharge, a state factor. */
    static int premium(Coverage coverage, int driverAge, boolean priorClaims, String state) {
        int base = switch (coverage) {
            case COLLISION -> 90;
            case COMPREHENSIVE -> 140;
            default -> 50;                 // LIABILITY + UNSPECIFIED
        };
        if (driverAge > 0 && driverAge < 25) {
            base += 40;                    // young-driver loading
        } else if (driverAge > 70) {
            base += 25;                    // senior loading
        }
        if (priorClaims) {
            base += 35;
        }
        int stateFactor = switch (state) {
            case "NY", "FL" -> 15;         // higher-cost states
            case "CA" -> 10;
            default -> 0;
        };
        return base + stateFactor;
    }

    static String policyClass(int driverAge, boolean priorClaims) {
        if (priorClaims) {
            return "SUBSTANDARD";
        }
        return driverAge >= 25 && driverAge <= 70 ? "PREFERRED" : "STANDARD";
    }

    static RateReply quote(RateRequest req, int monthly) {
        return RateReply.newBuilder()
                .setPolicyClass(policyClass(req.getDriverAge(), req.getPriorClaims()))
                .setMonthlyPremium(monthly)
                .setCurrency("USD")
                .build();
    }

    /** Validate the request; return a non-OK StatusRuntimeException (with rich details) or null if OK. */
    static io.grpc.StatusRuntimeException validate(RateRequest req) {
        String state = req.getState();
        boolean blank = state == null || state.isBlank();
        if (blank || !SUPPORTED_STATES.contains(state)) {
            // the gRPC analog of an HTTP 4xx problem body — a BadRequest field violation + an ErrorInfo
            // reason/domain, so a client can assert the rich details like a typed error body.
            String desc = blank ? "state is required" : "state '" + state + "' is not a supported rating territory";
            com.google.rpc.Status rich = com.google.rpc.Status.newBuilder()
                    .setCode(io.grpc.Status.Code.INVALID_ARGUMENT.value())
                    .setMessage(blank ? "state is required" : "unsupported state")
                    .addDetails(Any.pack(BadRequest.newBuilder()
                            .addFieldViolations(BadRequest.FieldViolation.newBuilder()
                                    .setField("state").setDescription(desc))
                            .build()))
                    .addDetails(Any.pack(ErrorInfo.newBuilder()
                            .setReason(blank ? "STATE_REQUIRED" : "STATE_UNSUPPORTED")
                            .setDomain("rating.karatelabs.io")
                            .putMetadata("field", "state")
                            .putMetadata("supported", String.join(",", new java.util.TreeSet<>(SUPPORTED_STATES)))
                            .build()))
                    .build();
            return StatusProto.toStatusRuntimeException(rich);
        }
        return null;
    }

    @Override
    public void rate(RateRequest request, StreamObserver<RateReply> response) {
        io.grpc.StatusRuntimeException err = validate(request);
        if (err != null) {
            response.onError(err);
            return;
        }
        int monthly = premium(request.getCoverage(), request.getDriverAge(), request.getPriorClaims(), request.getState());
        response.onNext(quote(request, monthly));
        response.onCompleted();
    }

    @Override
    public void streamQuotes(RateRequest request, StreamObserver<RateReply> response) {
        io.grpc.StatusRuntimeException err = validate(request);
        if (err != null) {
            response.onError(err);
            return;
        }
        int monthly = premium(request.getCoverage(), request.getDriverAge(), request.getPriorClaims(), request.getState());
        // one quote per term option: pay-monthly, semi-annual (5% off), annual (10% off)
        response.onNext(quote(request, monthly));
        response.onNext(quote(request, (int) Math.round(monthly * 0.95)));
        response.onNext(quote(request, (int) Math.round(monthly * 0.90)));
        response.onCompleted();
    }

    @Override
    public StreamObserver<RateRequest> batchRate(StreamObserver<RateReply> response) {
        return new StreamObserver<>() {
            final List<Integer> premiums = new ArrayList<>();
            RateRequest last;

            @Override
            public void onNext(RateRequest req) {
                io.grpc.StatusRuntimeException err = validate(req);
                if (err != null) {
                    throw err;   // a bad request in the batch fails the whole stream (INVALID_ARGUMENT)
                }
                last = req;
                premiums.add(premium(req.getCoverage(), req.getDriverAge(), req.getPriorClaims(), req.getState()));
            }

            @Override
            public void onError(Throwable t) {
                logger.warn("batchRate stream error: {}", t.getMessage());
            }

            @Override
            public void onCompleted() {
                int blended = premiums.isEmpty() ? 0
                        : (int) Math.round(premiums.stream().mapToInt(Integer::intValue).average().orElse(0));
                response.onNext(quote(last == null ? RateRequest.getDefaultInstance() : last, blended));
                response.onCompleted();
            }
        };
    }

    @Override
    public StreamObserver<RateRequest> negotiate(StreamObserver<RateReply> response) {
        return new StreamObserver<>() {
            @Override
            public void onNext(RateRequest req) {
                io.grpc.StatusRuntimeException err = validate(req);
                if (err != null) {
                    response.onError(err);
                    return;
                }
                int monthly = premium(req.getCoverage(), req.getDriverAge(), req.getPriorClaims(), req.getState());
                // counter with a small loyalty discount each round
                response.onNext(quote(req, (int) Math.round(monthly * 0.97)));
            }

            @Override
            public void onError(Throwable t) {
                logger.warn("negotiate stream error: {}", t.getMessage());
            }

            @Override
            public void onCompleted() {
                response.onCompleted();
            }
        };
    }

    public static Server start(int port) throws Exception {
        Server server = ServerBuilder.forPort(port)
                .addService(new RatingServer())
                // expose grpc.reflection.v1.ServerReflection so a client can connect with NO local .proto
                // and discover the service off the wire.
                .addService(ProtoReflectionServiceV1.newInstance())
                .build();
        server.start();
        logger.debug("rating gRPC server started on port: {}", server.getPort());
        return server;
    }

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 50052;
        Server server = start(port);
        logger.info("rating engine listening on :{}", server.getPort());
        server.awaitTermination();
    }
}
