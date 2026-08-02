// suite.karate.js — run the whole kit in one command:
//
//   karate launch suite.karate.js
//
// Two features, both headless and both in-process: the rules oracle over every stored application, and the
// REST checks against the service the spec's tasks describe. One suite, so the report is ONE traceability
// matrix spanning requirement -> rule -> API. Seconds, no browser, nothing to install.
//
// Report output: `karate launch` writes the canonical `target/karate-reports` (HTML + JUnit XML + JSONL).
var result = Runner.run(['oracle.feature', 'decision-api.feature']);
if (result.failed > 0) {
  throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
}
