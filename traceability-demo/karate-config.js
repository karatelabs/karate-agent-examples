function fn() {
  // the Loan Desk SUT is a static app under sut/, served on :9100 (`launch suite.karate.js` starts it). The default below
  // targets the host from INSIDE the karate-agent container (the browser stage's primary runtime); a
  // bare-metal run overrides with -Dloan.url=http://localhost:9100. Container-first, same as the guidewire
  // kit — the reverse default failed every in-container row with no knob reachable from the console.
  // cdp.url attaches the bot to a specific Chrome over CDP (unset in-container — the bot uses KARATE_CDP_URL).
  var loanUrl = karate.sysprop('loan.url', 'http://host.docker.internal:9100');
  var cdpUrl = karate.sysprop('cdp.url') || null;

  // The REST half (cov.openapi): AUTO-START the in-process Loan Decision API mock ONCE per suite
  // (mock/start.js via callSingle) and point baseUrl at it — so checks/loan-api.feature "just works", no
  // server process. An external -DbaseUrl wins (e.g. a host test that stands up its own backend).
  // project-root-anchored ('/mock/...'): resolves identically from a feature run AND config-eval.
  var baseUrl = karate.sysprop('baseUrl');
  if (!baseUrl) {
    baseUrl = karate.callSingle('/mock/start.js').baseUrl;
  }
  return { loanUrl: loanUrl, cdpUrl: cdpUrl, baseUrl: baseUrl };
}
