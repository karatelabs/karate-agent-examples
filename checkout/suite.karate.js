// suite.karate.js — launch the checkout demo in one command, producing ONE consolidated report:
//   docker run … karate-agent launch suite.karate.js     (the container / CI report lane)
//
// Two lanes, one graph:
//   1. checks/payments-contract.feature ALWAYS runs — the consumer's contract suite over the payments
//      dependency, against the auto-started mock (karate-config.js): fast, hermetic, no process. Its
//      calls land on the payments-api.yaml coverage universe, and — because only our own mock ever
//      answered — every covered operation reads `mockOnly: true` in the coverage data: the report
//      disclosing, structurally, that the dependency evidence is mock-backed. The paired run
//      (contract.karate.js, run separately against the real PaymentsServer) is what upgrades that
//      disclosure into a substitutability claim.
//   2. checks/checkout.feature (@e2e) joins ONLY when the SUT is up (the README's e2e lane), launched with
//      -Dcheckout.url=http://localhost:8080 — the end-to-end lane through the real consumer.
var features = ['checks/payments-contract.feature'];
if (Settings.sysprop('checkout.url')) {
  features.push('checks/checkout.feature');
}
var result = Runner.run(features);

Report.generate();
Report.traceability();

if (result.failed > 0) {
  throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
}
