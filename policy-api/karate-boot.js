// The all-in-one INSURANCE demo — REST (OpenAPI) + gRPC (the rating engine, PRIMARY) + Kafka (OPTIONAL).
// Boot the protocol exts and declare the coverage universes once here (central config), so the features
// only name the proto/service/method (gRPC) and the spec is the operation universe (REST).
var grpc = boot.ext('grpc');
grpc.host = boot.sysprop('grpc.host', 'localhost');
grpc.port = boot.sysprop('grpc.port', '50052');   // the rating engine (started separately on :50052)
grpc.protoRoots = ['.'];

var cov = boot.ext('coverage');
// gRPC: the proto/ DIRECTORY is the rating method universe (service × method) — the gRPC analog of an
// OpenAPI spec. The run's grpc-match traffic joins by service/method; the .proto's protovalidate field
// bounds + enums reverse-infer the INPUT dimensions (coverage enum, driver_age BVA, state length).
cov.grpc = 'proto';
// OpenAPI: the Policy API operation universe (path × method) — the http-match traffic joins by path/method.
cov.openapi = 'openapi.yaml';

// Kafka — OPTIONAL fourth beat (the one protocol whose backend wants Docker, so it is OFF by default and
// out of CI). Start Kafka (KRaft broker + Schema Registry via kafka/docker-compose.yml), then
// uncomment below to add the event-side universe (policy-events topic, Avro policy-event schema):
// var kafka = boot.ext('kafka');
// kafka.bootstrap = boot.sysprop('kafka.bootstrap', '127.0.0.1:29092');
// kafka.schemaRegistry = boot.sysprop('kafka.schemaRegistry', 'http://localhost:8081');
// cov.kafka = { schemaRegistry: kafka.schemaRegistry, topics: [ { topic: 'policy-events', schema: 'policy-event' } ] };
