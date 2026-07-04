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
// tab + JSONL for coverage/RTM), all in ONE graph:
//   1. rating-oracle.feature runs the `rating` rulebook over each saved scenario — every row's Rule.execute
//      emits the rulebook's calc.req hits, so the RTM lights each requirement the scenarios reach
//      (RATE-001/1 young, RATE-002/1 prior-claims) and leaves the senior-driver arm RATE-001/2 the gap →
//      readiness NOT READY, blocker RATE-001; each requirement id deep-links to its markdown heading on
//      GitHub (requirements.provider, wired in karate-boot.js);
//   2. quotes.feature is the covering-array demo (6 of 30 combinations, the 9-cell deck) and policy.feature
//      exercises the OpenAPI operations, so cov.openapi grades the REST coverage in the SAME report.
//   3. Report.generate() + Report.traceability() render the Coverage + Traceability HTML from that one graph.
// Requirement coverage rides the run itself (calc.req), so it does NOT overwrite the run's REST coverage —
// the published report carries the 6/30 Coverage view AND the NOT READY / RATE-001 RTM together.
// The REST mock auto-starts from karate-config.js — no external SUT, no host networking.
var result = Runner.run(['checks/rating-oracle.feature', 'checks/quotes.feature', 'checks/policy.feature']);

Report.generate();
Report.traceability();

if (result.failed > 0) {
  throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
}
