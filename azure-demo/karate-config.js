function fn() {
  // the Loan Desk SUT is a static app under sut/ — serve it on :9100 (the default below). Override loan.url
  // for another port / a docker-internal host (e.g. host.docker.internal:<port> from inside a container).
  // cdp.url attaches the bot to a specific Chrome over CDP (unset in-container — the bot uses KARATE_CDP_URL).
  var loanUrl = karate.properties['loan.url'] || 'http://localhost:9100';
  var cdpUrl = karate.properties['cdp.url'] || null;

  // The REST half (cov.openapi): AUTO-START the in-process Loan Decision API mock ONCE per suite
  // (mock/start.js via callSingle) and point baseUrl at it — so checks/loan-api.feature "just works", no
  // server process. An external -DbaseUrl wins (e.g. a host test that stands up its own backend).
  // project-root-anchored ('/mock/...'): resolves identically from a feature run AND config-eval.
  var baseUrl = karate.properties['baseUrl'];
  if (!baseUrl) {
    baseUrl = karate.callSingle('/mock/start.js').baseUrl;
  }
  return { loanUrl: loanUrl, cdpUrl: cdpUrl, baseUrl: baseUrl };
}
