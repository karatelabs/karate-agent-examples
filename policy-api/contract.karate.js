// contract.karate.js — the PAIRED RUN: one suite, two targets, a measured divergence set.
//
//   java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080
//   docker run … karate-agent launch contract.karate.js # (or Contract.pair(...) from the console)
//
// checks/policy.feature runs TWICE in one session — once against mock/policy-mock.feature (the mock this
// project ships to consuming teams) and once against rating-server's REST face (a second implementation of
// the same openapi.yaml, in Java, sharing only the rate book). What comes back is not a pass/fail: it is
// the set of places the two DIFFERED, and the rung that set entitles us to claim.
//
// Why it is worth running at all: the suite is green against the mock by construction — that is what a mock
// is for. It says nothing about whether a team building against the mock is building against the truth.
// This does, and it is the only thing that moves the `contract` dimension of Openapi.grade.

// The provider. A launch script is sandboxed (no env, no sysprops), so the port is a constant here —
// point it at a staging deployment when you have one: the same call with a better URL, and the evidence
// records which one it was.
var provider = 'http://localhost:8080';

// EVERY ignore rule is a waiver: it re-classifies a difference, it never hides one (both values stay in the
// artifact), and it owes a reason and an owner exactly as a lint waiver does. These three say the same
// thing three times — two independent implementations mint their own surrogate keys, and the CONTRACT does
// not fix the value, only that the reference resolves. Nothing else here is excused.
var surrogateKeys = [
  {
    id: 'surrogate-primary-key', key: 'id', marker: '#string',
    reason: 'each target mints its own primary key; openapi.yaml fixes the type, never the value',
    owner: 'policy-api team'
  },
  {
    id: 'bound-quote-ref', key: 'quoteId', marker: '#string',
    reason: 'a policy references the quote it was bound from by the id THAT target minted for it',
    owner: 'policy-api team'
  },
  {
    id: 'claim-policy-ref', key: 'policyId', marker: '#string',
    reason: 'a claim references the policy it was filed against by the id THAT target minted for it',
    owner: 'policy-api team'
  }
];

var pair = Contract.pair({
  suite: 'checks/policy.feature',
  spec: 'openapi.yaml',
  provider: provider,
  // NAME THE MOCK. Omit it and the harness synthesizes one from openapi.yaml — which agrees with
  // spec-shaped assertions by construction and is a different subject from the mock this project ships.
  mock: 'mock/policy-mock.feature',
  // karate-config.js already reads `baseUrl`, so the harness hands each leg its target through that
  // property rather than the suite being rewritten around a contract-testing convention
  targetProp: 'baseUrl',
  ignore: surrogateKeys,
  providerEnv: 'local'
});

if (pair.error) {
  throw 'contract: no pair was minted — ' + pair.error;
}

console.log(Contract.read(pair.evidenceFile, { output: 'markdown' }).markdown);

// The rung is what the pair entitles this project to SAY, and it is deliberately not a percentage. The
// aggregate is the FLOOR of the per-operation rungs and is capped while any declared operation is
// unexercised — cancelPolicy and getClaim are exactly that here, and the claim names them rather than
// rounding them up. `Openapi.grade('openapi.yaml')` reads this file and scores the `contract` dimension
// as the rung normalised.
var rung = pair.claim.rungs.aggregate;
console.log('contract: rung ' + rung.rung + ' — ' + rung.name + '  (evidence: ' + pair.evidenceFile + ')');
