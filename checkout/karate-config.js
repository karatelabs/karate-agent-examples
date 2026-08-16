function fn() {
  // TWO targets, named apart on purpose — this kit is the consumer-side contract-testing demo, so "which
  // service am I talking to" must never be ambiguous:
  //   paymentsUrl — the DEPENDENCY (the payments API). An external value wins (a paired run hands each
  //                 leg its target through this property — contract.karate.js targetProp); otherwise the
  //                 team's own mock auto-starts in-process ONCE per suite (mock/start.js via callSingle).
  //   checkoutUrl — the SUT (the checkout service, a real Java app started separately — the README's e2e lane). Only the @e2e
  //                 checks need it; when it is not set those checks are selected out, not failed.
  // `paymentsUrl` (the exact targetProp name) is how a paired run hands each leg its target — it MUST
  // win over everything else; `payments.url` is the human-friendly spelling for a manual run
  var paymentsUrl = karate.sysprop('paymentsUrl') || karate.sysprop('payments.url');
  if (!paymentsUrl) {
    paymentsUrl = karate.callSingle('/mock/start.js').paymentsUrl;
  }
  var checkoutUrl = karate.sysprop('checkout.url');
  return { paymentsUrl: paymentsUrl, checkoutUrl: checkoutUrl };
}
