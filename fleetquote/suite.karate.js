// suite.karate.js — run the whole kit in one command (a human or CI):
//   karate launch suite.karate.js
//   docker run … karate-agent launch suite.karate.js
//
// Self-contained, no server process: it starts the kit's own stateful mock on the port karate-config.js
// points baseUrl at, runs both check suites as ONE report (HTML + JUnit XML for the CI tests tab + JSONL
// for coverage/RTM) under target/karate-reports, then renders the rating rulebook's Analysis report
// beside it, and exits non-zero if any scenario failed.
var mock = File.call('/mock/start.js');
try {
  var result = Runner.run(['checks/lifecycle.feature', 'checks/rating.feature']);
  Rule.report('rating', { out: 'target/karate-reports/' });
  if (result.failed > 0) {
    throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
  }
} finally {
  mock.stop();
}
