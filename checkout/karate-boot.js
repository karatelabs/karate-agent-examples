// The CONSUMER-SIDE contract-testing demo — a checkout SUT that depends on an external payments API.
// The coverage universe here is deliberately THE DEPENDENCY's contract, not the SUT's own: the question
// this kit exists to answer is "which payments operations does checkout actually rely on, is each of
// them exercised, and can our mock of that dependency stand in for the real thing?" — so the graph is
// built over payments-api.yaml and the paired run's evidence lands beside it.
var cov = boot.ext('coverage');
cov.openapi = 'payments-api.yaml';
// CHK-* (the checkout flows) + PAY-* (what this team relies on the dependency for) — the PAY criteria
// are claimed by checks/payments-contract.feature, the same suite the paired run proves the mock with.
cov.requirements = 'requirements';

// This project does CONSUMER-SIDE CONTRACT TESTING — one suite against the dependency's mock and the
// real provider — so its reports carry a Contract tab beside Coverage and Traceability. Booting it IS
// the declaration; contract.karate.js is what mints a pair.
boot.ext('contract');

// ...and it grades the dependency's spec on the same Governance tab the provider-side kits get: the
// `contract` dimension reads the recorded pair, so "how substitutable is our payments mock" becomes a
// rung in the grade rather than a claim in a wiki.
boot.ext('governance');
