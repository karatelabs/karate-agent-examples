// suite.karate.js — launch the policy-api demo in one command, producing the ONE consolidated report the
// public GitHub Pages site publishes (browsable, clickable, no license needed to READ it):
//   docker run … karate-agent launch suite.karate.js     (the container / CI report lane — REST + rules)
//
// This is the REST-ONLY lane (KARATE_GRPC_OFF is set by the CI workflow): the container image has no
// grpc/kafka ext, so karate-boot.js skips the grpc beat and the run is REST (OpenAPI) + the run-free rules
// RTM. The full REST + gRPC + Kafka cross-protocol story runs live off the async jar (see the README);
// that heavier protocol lane is not what the published report covers.
//
// What lands in target/karate-reports (the CLI-default launch report dir — HTML + JUnit XML for the Tests
// tab + JSONL for coverage/RTM):
//   1. the REST checks — quotes.feature is the covering-array demo (6 of 30 combinations, the 9-cell deck),
//      policy.feature exercises the OpenAPI operations so cov.openapi grades which were hit;
//   2. Rule.cover('rating') projects the run-free SIMULATED requirement coverage — the readiness verdict
//      (NOT READY, blocker RATE-001, the senior-driver gap) and the RTM whose requirement ids deep-link to
//      their markdown heading on GitHub (requirements.provider, wired in karate-boot.js);
//   3. Report.generate() + Report.traceability() render the Coverage + Traceability HTML into the report dir.
// The REST mock auto-starts from karate-config.js — no external SUT, no host networking.
var result = Runner.run(['checks/quotes.feature', 'checks/policy.feature']);

// project the run-free rules→requirements RTM (the senior-driver gap → RATE-001 → NOT READY) and render it
Rule.cover('rating');
Report.generate();
Report.traceability();

if (result.failed > 0) {
  throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
}
