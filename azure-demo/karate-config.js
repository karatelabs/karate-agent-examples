function fn() {
  // the Loan Desk SUT is a static app under sut/ — serve it on :9100 (the default below). Override loan.url
  // for another port / a docker-internal host (e.g. host.docker.internal:<port> from inside a container).
  // cdp.url attaches the bot to a specific Chrome over CDP (unset in-container — the bot uses KARATE_CDP_URL).
  var loanUrl = karate.properties['loan.url'] || 'http://localhost:9100';
  var cdpUrl = karate.properties['cdp.url'] || null;
  return { loanUrl: loanUrl, cdpUrl: cdpUrl };
}
