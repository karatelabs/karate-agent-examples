// contract.karate.js — the CONSUMER-SIDE paired run: prove OUR MOCK OF THEIR API is faithful.
//
//   javac -d servers/classes servers/src/io/karatelabs/examples/checkout/*.java
//   java -cp servers/classes io.karatelabs.examples.checkout.PaymentsServer 8090   # the "real" provider
//   docker run … karate-agent launch contract.karate.js   # (or Contract.pair(...) from the console)
//
// checks/payments-contract.feature runs TWICE in one session — once against mock/payments-mock.feature
// (the test-double the checkout team builds against every day) and once against the real payments
// provider. What comes back is not a pass/fail: it is the set of places the two DIFFERED, and the rung
// that set entitles this team to claim for its mock.
//
// This is consumer-driven contract testing without the ceremony: the "consumer contract" is this
// ordinary functional suite (not a pact file), the exchange happens through git (not a broker), and
// provider verification is the provider leg of this very run (not a replay of recorded interactions).
// References — the approach this kit productizes:
//   https://www.linkedin.com/pulse/api-contract-testing-visual-guide-peter-thomas
//   https://github.com/karatelabs/karate/tree/v1.5.2/examples/consumer-driven-contracts
//   https://stackoverflow.com/a/64218355/143475

// The real provider. CI hands it in — `PAYMENTS_URL` in the environment, or `-Dpayments.provider=…` on
// the command line — and the local default is the PaymentsServer command above. Point it at the
// provider's staging deployment when you have one: same call, better URL, and the evidence records which.
var provider = Settings.sysprop('payments.provider', Settings.sysenv('PAYMENTS_URL', 'http://localhost:8090'));
var providerEnv = Settings.sysenv('PAYMENTS_ENV', 'local');

// EVERY ignore rule is a waiver: it re-classifies a difference, it never hides one (both values stay in
// the artifact), and it owes a reason and an owner. These two say the same thing twice — each
// implementation mints its own surrogate keys, and the CONTRACT fixes the type, never the value.
// Nothing else is excused: in particular `network` is NOT excused, so the mock's 'VISA' against the
// provider's 'visa' surfaces as the unassertedDivergence the README walks through.
var surrogateKeys = [
  {
    id: 'surrogate-payment-id', key: 'id', marker: '#string',
    reason: 'each implementation mints its own payment/refund ids; payments-api.yaml fixes the type, never the value',
    owner: 'checkout team'
  },
  {
    id: 'payment-ref', key: 'paymentId', marker: '#string',
    reason: 'a refund references the payment by the id THAT target minted for it',
    owner: 'checkout team'
  }
];

var pair = Contract.pair({
  suite: 'checks/payments-contract.feature',
  spec: 'payments-api.yaml',
  provider: provider,
  // NAME THE MOCK. Omit it and the harness synthesizes one from payments-api.yaml — which agrees with
  // spec-shaped assertions by construction and is a different subject from the mock this team ships.
  mock: 'mock/payments-mock.feature',
  // karate-config.js reads `paymentsUrl`, so the harness hands each leg its target through that property
  targetProp: 'paymentsUrl',
  ignore: surrogateKeys,
  providerEnv: providerEnv
});

if (pair.error) {
  throw 'contract: no pair was minted — ' + pair.error;
}

console.log(Contract.read(pair.evidenceFile, { output: 'markdown' }).markdown);

// ...and the same reading as a PAGE, in the report dir, for whoever is not at a prompt. It renders what
// Contract.read returns and re-derives nothing, so the page and the verb cannot disagree.
var page = Contract.report(pair.evidenceFile);
if (page.error) {
  throw 'contract: the pair was minted but its report page could not be written — ' + page.error;
}
console.log('contract: report ' + page.url);

// Re-render the sibling pages so their nav can reach this one — both are pure functions of the graph
// already on disk, and it costs nothing when there is no graph yet.
if (!Report.generate().error) {
  Report.traceability();
}

// A pair that measured NOTHING is the honest answer to an unreachable provider — and it must still fail
// this job: in CI it means the provider never came up, which is a broken run, not a clean bill of health.
if (!pair.claim || !pair.claim.rungs) {
  console.log(pair.claimSentence);
  throw 'contract: the pair measured NOTHING — the provider at ' + provider + ' produced no comparable '
      + 'result (see the notMeasured causes above). Nothing here says the mock is faithful, and nothing '
      + 'says it is not.';
}

// The rung is what this pair entitles the CHECKOUT TEAM to say about ITS OWN MOCK — deliberately not a
// percentage. Expect the unassertedDivergence rows (the `network` casing) to hold the affected
// operations below the top rung until the suite tightens or a waiver signs the difference off — that
// pressure on the suite is the point. `Openapi.grade('payments-api.yaml')` reads this file and scores
// the `contract` dimension as the rung normalised.
var rung = pair.claim.rungs.aggregate;
console.log('contract: rung ' + rung.rung + ' — ' + rung.name + '  (evidence: ' + pair.evidenceFile + ')');
