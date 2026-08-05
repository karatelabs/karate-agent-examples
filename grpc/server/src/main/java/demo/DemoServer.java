package demo;

import io.grpc.Grpc;
import io.grpc.InsecureServerCredentials;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.ForwardingServerCall;
import io.grpc.Server;
import io.grpc.stub.StreamObserver;

import java.util.ArrayList;
import java.util.List;

/**
 * The demo gRPC service the checks run against — a stand-in for your real service.
 *
 * <p>It implements one method of each of the four gRPC shapes, so the checks can show how each is
 * driven: unary, server-streaming, client-streaming and bidirectional. It also echoes an
 * {@code authorization} request header back as {@code authorization-response}, so the checks can assert
 * metadata round-tripping.</p>
 *
 * <p>Run it with the engine jar on the classpath — the engine already bundles gRPC and protobuf, so this
 * server needs no fat jar of its own. See the README.</p>
 */
public class DemoServer extends HelloServiceGrpc.HelloServiceImplBase {

    /** Copies an incoming {@code authorization} header back on the response, for the metadata check. */
    static class MetadataInterceptor implements ServerInterceptor {
        @Override
        public <Q, P> ServerCall.Listener<Q> interceptCall(ServerCall<Q, P> call, Metadata headers,
                                                           ServerCallHandler<Q, P> next) {
            Metadata.Key<String> auth = Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
            String value = headers.get(auth);
            ServerCall<Q, P> wrapped = new ForwardingServerCall.SimpleForwardingServerCall<>(call) {
                @Override
                public void sendHeaders(Metadata responseHeaders) {
                    if (value != null) {
                        responseHeaders.put(
                                Metadata.Key.of("authorization-response", Metadata.ASCII_STRING_MARSHALLER),
                                value + "-response");
                    }
                    super.sendHeaders(responseHeaders);
                }
            };
            return next.startCall(wrapped, headers);
        }
    }

    private static HelloReply reply(String message) {
        return HelloReply.newBuilder().setMessage(message).build();
    }

    /** unary — one request, one response. */
    @Override
    public void hello(HelloRequest request, StreamObserver<HelloReply> observer) {
        String name = request.getName();
        // an empty name is rejected, so a check can drive the error path and assert the status
        if (name == null || name.isEmpty()) {
            observer.onError(io.grpc.Status.INVALID_ARGUMENT
                    .withDescription("name is required").asRuntimeException());
            return;
        }
        observer.onNext(reply("hello " + name));
        observer.onCompleted();
    }

    /** server-streaming — one request, a stream of responses. */
    @Override
    public void lotsOfReplies(HelloRequest request, StreamObserver<HelloReply> observer) {
        for (int i = 1; i <= 3; i++) {
            observer.onNext(reply("hello " + request.getName() + " " + i));
        }
        observer.onCompleted();
    }

    /** client-streaming — a stream of requests, one response when the client is done. */
    @Override
    public StreamObserver<HelloRequest> lotsOfGreetings(StreamObserver<HelloReply> observer) {
        List<String> names = new ArrayList<>();
        return new StreamObserver<>() {
            @Override
            public void onNext(HelloRequest request) {
                names.add(request.getName());
            }

            @Override
            public void onError(Throwable t) {
                // client went away mid-stream; nothing to clean up in a demo
            }

            @Override
            public void onCompleted() {
                observer.onNext(reply("hello " + names));
                observer.onCompleted();
            }
        };
    }

    /** bidirectional — a response per request, on the same open stream (here: the running list so far). */
    @Override
    public StreamObserver<HelloRequest> bidiHello(StreamObserver<HelloReply> observer) {
        List<String> names = new ArrayList<>();
        return new StreamObserver<>() {
            @Override
            public void onNext(HelloRequest request) {
                names.add(request.getName());
                observer.onNext(reply("hello " + names));
            }

            @Override
            public void onError(Throwable t) {
                // client went away mid-stream
            }

            @Override
            public void onCompleted() {
                observer.onCompleted();
            }
        };
    }

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 50051;
        Server server = Grpc.newServerBuilderForPort(port, InsecureServerCredentials.create())
                .addService(new DemoServer())
                .intercept(new MetadataInterceptor())
                .build()
                .start();
        System.out.println("demo gRPC service listening on localhost:" + server.getPort());
        server.awaitTermination();
    }

}
