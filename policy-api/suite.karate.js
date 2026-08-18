// suite.karate.js — launch the policy-api demo in one command, producing the ONE consolidated report the
// public GitHub Pages site publishes (browsable, clickable, no license needed to READ it):
//   docker run … karate-agent launch suite.karate.js     (the container / CI report lane — REST + rules)
//
// The DEFAULT lane is REST-only (on the container image KARATE_GRPC_OFF is set too: that image has no
// grpc/kafka ext, so karate-boot.js skips the grpc beat and the run is REST (OpenAPI) + the run-free rules
// RTM). The full REST + gRPC + Kafka cross-protocol lane is an explicit opt-IN on an engine that carries
// the protocol leafs (the karate-async jar), with the backends up (the gRPC rating engine on :50052; the
// Kafka broker + registry via kafka/docker-compose.yml):
//
//   KARATE_GRPC_ON=1 KARATE_KAFKA_ON=1 java -jar karate-async-<version>.jar launch suite.karate.js
//
// The flags must be opt-in HERE because a launch script is sandboxed — it has no boot object to ask
// whether a protocol leaf is present, only the Settings.sysprop/sysenv config door — so the lane is a
// parameter. KARATE_GRPC_ON adds the gRPC suite (checks/rating.feature, tagged @grpc); KARATE_KAFKA_ON
// adds the producer beat (checks/policy-events.feature, tagged @kafka) AND is the same flag that makes
// karate-boot.js boot the kafka ext + declare cov.kafka. CI runs this full lane last, off the async jar,
// so the published report spans all three protocols in one graph.
//
// What lands in target/karate-reports (the CLI-default launch report dir — HTML + JUnit XML for the Tests
// tab + JSONL for coverage/RTM), all in ONE graph:
//   1. rating-acceptance.feature runs each saved scenario LIVE against the /quotes API — a real HTTP call
//      (an OBSERVED receipt) plus the rulebook's calc.req — so the RTM lights each requirement the scenarios
//      reach as genuinely COVERED (RATE-001/1 young, RATE-002/1 prior-claims, RATE-003/1 territory), leaving
//      the senior-driver criterion RATE-001/2 the live gap → readiness NOT READY, blocker RATE-001; each
//      requirement id deep-links to its markdown heading on GitHub (requirements.provider, karate-boot.js);
//   2. quotes.feature is the covering-array demo (6 of 30 combinations, the 9-cell deck) and policy.feature
//      exercises the OpenAPI operations, so cov.openapi grades the REST coverage in the SAME report.
//   3. Report.generate() + Report.traceability() render the Coverage + Traceability HTML from that one graph.
// Requirement coverage rides the live run itself, so it does NOT overwrite the run's REST coverage — the
// published report carries the Coverage view AND the NOT READY / RATE-001 RTM together. The REST mock
// auto-starts from karate-config.js — no external SUT, no host networking.
var features = ['checks/rating-acceptance.feature', 'checks/quotes.feature', 'checks/policy.feature'];
if (Settings.sysprop('KARATE_GRPC_ON', Settings.sysenv('KARATE_GRPC_ON'))) {
  features.push('checks/rating.feature');           // the gRPC lane — needs the rating engine on :50052
}
if (Settings.sysprop('KARATE_KAFKA_ON', Settings.sysenv('KARATE_KAFKA_ON'))) {
  features.push('checks/policy-events.feature');    // the Kafka producer beat — needs the broker + registry
}
var result = Runner.run(features);

Report.generate();
Report.traceability();

if (result.failed > 0) {
  throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
}
