// suite.karate.js — launch the WHOLE azure-demo in one command (a human or CI):
//   karate launch suite.karate.js          (locally: opens a visible Chrome)
//   docker run … karate-agent launch suite.karate.js   (in-container: self-launched HEADLESS Chromium)
//
// It is fully self-contained — no external static-file server, no host networking:
//   1. serve the static SUT on the port karate-config.js defaults `loanUrl` to;
//   2. run the headless rules oracle + the REST API check + the browser UI feature as ONE suite, so the
//      report is ONE consolidated RTM spanning requirement → rule → API → UI;
//   3. stop the SUT and signal a non-zero exit if any scenario failed (so CI goes red).
// The REST mock auto-starts from karate-config.js; the browser feature drives the SUT with `bot`
// (self-launched Chrome). Requirement-link provider (ADO / git) is wired in karate-boot.js, unchanged.
var sut = Http.serve('sut', 9100);
try {
  var result = Runner.run(['oracle.feature', 'checks/loan-api.feature', 'loan-rate-ui.feature']);
  if (result.failed > 0) {
    throw 'launch: ' + result.failed + ' of ' + result.total + ' scenarios failed — see ' + result.reportUrl;
  }
} finally {
  sut.stop();
}
