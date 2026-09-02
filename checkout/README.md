# checkout — consumer-side contract testing: prove your mock of THEIR API

Your API depends on a service you don't own. This kit is that whole situation, in about five files'
worth of reading. A **checkout service** (the SUT — a real Java app) cannot confirm an order without
calling a **payments API** owned by someone else. The kit holds the **mock of that dependency** the
checkout team builds against every day, and the **paired run** that proves the mock can stand in for
the real thing.

The definition this kit runs on comes from
[API Contract Testing — A Visual Guide](https://www.linkedin.com/pulse/api-contract-testing-visual-guide-peter-thomas),
and its two sentences map exactly onto the two things a paired run measures:

> *Contract Tests should alert you when an API you depend on behaves differently from what you are
> expecting* — that is the **provider leg**: your suite, run against the real payments service.
>
> *Contract Tests should alert you if a test-double for the above API cannot simulate all the behaviors
> in scope* — that is the **divergence set**: the measured difference between the mock leg and the
> provider leg.

Further reading — this kit is the productized form of both:
[the karate consumer-driven-contracts example](https://github.com/karatelabs/karate/tree/v1.5.2/examples/consumer-driven-contracts) ·
[Karate vs Pact](https://stackoverflow.com/a/64218355/143475).

## The topology

```
 checks/checkout.feature ──▶ CheckoutServer (the SUT, a consumer)
                                   │  POST /payments        ▲ PAYMENTS_URL decides which:
                                   ▼                        │
                     ┌──────────────────────────┐   ┌──────────────────────────────┐
                     │ mock/payments-mock       │   │ PaymentsServer (the "real"   │
                     │ .feature — the team's    │   │ provider — an independent    │
                     │ everyday test-double     │   │ implementation of the same   │
                     └──────────▲───────────────┘   │ payments-api.yaml)           │
                                │                   └──────────────▲───────────────┘
 checks/payments-contract.feature — ONE suite, run against BOTH ───┘
 (contract.karate.js = the paired run that measures the divergence)
```

- `payments-api.yaml` — the dependency's contract (amounts are integer cents; money never rides a
  float).
- `checks/payments-contract.feature` — **the contract, as a suite**: every behavior checkout relies
  on (approve, the decline rule, read-back, refund-once, the declared error paths). It names its
  target once (`paymentsUrl`) and nowhere else, so it is target-swappable by construction.
- `mock/payments-mock.feature` — stateful, typed, refuses what the real provider refuses.
  `karate-config.js` auto-starts it in-process, so the everyday lane needs no server at all.
- `servers/…/PaymentsServer.java` + `CheckoutServer.java` — pure JDK, no build tool: plain `javac`
  compiles them (below).

## Run it

Drop the engine jar (`karate-agent-2.1.3.RC3.jar`) and your `karate.lic` into the kit folder
— or use the container image the same way the CI workflow does.

```sh
# the everyday lane — no server processes at all, the payments mock auto-starts in-process:
java -jar karate-agent-2.1.3.RC3.jar launch suite.karate.js

# compile the kit's two servers, once (pure JDK — no maven):
javac -d servers/classes servers/src/io/karatelabs/examples/checkout/*.java

# the paired run — prove the mock against the real provider:
java -cp servers/classes io.karatelabs.examples.checkout.PaymentsServer 8090 &
java -jar karate-agent-2.1.3.RC3.jar launch contract.karate.js

# the full e2e lane — the real consumer through its real dependency:
java -cp servers/classes io.karatelabs.examples.checkout.CheckoutServer 8080 http://localhost:8090 &
java -Dcheckout.url=http://localhost:8080 -jar karate-agent-2.1.3.RC3.jar launch suite.karate.js

# the resilience lane — the mock told to MISBEHAVE, grading checkout itself (expect red — see below).
# NOTE: stop the e2e lane's CheckoutServer first — it holds :8080 (kill %1);
# a leftover e2e checkout still points at the REAL provider, so no fault would ever reach it:
java -cp servers/classes io.karatelabs.examples.checkout.CheckoutServer 8080 http://localhost:8091 &
java -jar karate-agent-2.1.3.RC3.jar launch resilience.karate.js
```

## What the pair will find — three teaching moments, all deliberate

1. **The finding your assertions cannot see.** The mock reports the card network as `'VISA'`; the
   real provider reports `'visa'`. The suite never asserts on `network`, so **both legs pass** — and
   the pair still reports the difference, as an `unassertedDivergence`. That is a finding about *the
   suite*: its assertions are too loose to see what changed underneath it. No green build can produce
   that signal. Tighten the assertion, or sign the difference off with a named ignore rule, and
   re-run the pair — either way the decision is on the record. Do not "fix" `PaymentsServer.java` to
   match the mock: the disagreement is the demo.
2. **Ignoring a difference is a signed exception.** Each implementation generates its own payment ids
   (`pay-1` vs `p-1001`). The contract fixes the *type*, never the value. So `contract.karate.js`
   excuses the difference through named ignore rules that carry a reason and an owner, and both
   values stay in the artifact. A rule that excused nothing gets flagged stale.
3. **The wire decides what was proven.** `PaymentsServer` sends no `Karate-Mock` header, so the
   pair's rehearsal check reads *"the responder was not one of our mocks"* — which is what lets the
   rung mean something. Point `provider` at a second instance of your own mock instead, and the pair
   calls itself a **rehearsal**, caps the rung, and says so in the claim sentence. Try it.

And in the everyday report (`suite.karate.js`), every covered payments operation reads
**`mockOnly: true`** — the coverage graph disclosing that only our own stand-in ever answered the
dependency. That disclosure is exactly the debt the paired run pays off.

## The resilience lane — the same mock, told to misbehave

The paired run proves the mock *faithful*; the resilience lane turns that same artifact into an
adversary. `resilience.karate.js` serves `mock/payments-mock.feature` with the **frozen fault deck**
(`mutation/fault-manifest.json`): a payments 500, a connection that dies mid-request, a 2.5-second
stall, an approval missing its `id`. Each scenario of `checks/payments-resilience.feature` **arms one
fault** over the mock's own control endpoint (`POST <mock>/__karate/fault {id}` — plain HTTP, so a curl
works too — only `{id: '<fault id>'}` arms and `{id: null}` disarms; anything else is refused), drives
the **real checkout service** through it, and judges the consumer. Every tampered response is stamped
`Karate-Mutant: <fault id>` — except the connection-reset fault, which sends nothing on the wire and is
attributed in the served log instead — and the served log ties each fault to the calls it hit. The
fault-armed mock binds **loopback only** by default: its control endpoint is unauthenticated, so
reaching it from another machine requires an explicit `host` opt-in.

**The verdicts are authored, never derived** — each assertion is this team's statement of what
resilient looks like, so a fault checkout *tolerates* is a **pass**, and a red is a **finding about
checkout**. This kit carries **two deliberate findings** — do not "fix" `CheckoutServer.java` to hide
them, they are the demo:

1. **No timeout on the dependency call.** Checkout's payments client waits forever, so a stalled
   provider stalls every order (the 2.5s stall breaches the authored two-second budget — and a provider
   that never answered would hang checkout indefinitely).
2. **A CONFIRMED order with no payment reference.** When the provider's answer is missing its `id`,
   checkout records the order as `CONFIRMED` with `paymentId: null` — an order it can never reconcile,
   refund, or audit.

No pact-style artifact could express either: a pact file records happy interactions and carries no
fault deck, and broker-side contract comparison never *executes* the consumer at all. One artifact —
the dependency's mock — now proves fidelity (the pair) **and** grades resilience (the fault feed).

Two rails, both deliberate: fault-fed runs are **instrument runs** — the backend is deliberately
broken, so nothing in them is evidence about the system. The quarantine is the launcher's job:
`resilience.karate.js` writes under `target/resilience`, never `runs/`, which is what keeps the seeded
failures out of readiness and the RTM — keep that output choice if you adapt the lane (the `CHK-003`
criteria read as exercised in the resilience run's *own*
report, which is exactly where evidence gathered against a sabotaged dependency belongs). And nothing
here is a *mutation score* — grading your suite's oracles is the mutation lane; grading **your
service** against a misbehaving dependency is this one, and the two numbers never mix.

## This is consumer-driven contract testing — without the ceremony

The question teams arrive with is usually shaped by Pact, so here is the translation, term by term:

| Pact-style CDC | this kit |
|---|---|
| the pact file (interactions recorded from consumer unit tests) | `checks/payments-contract.feature` — the consumer's expectations as an ordinary, readable, *functional* suite |
| the broker (a server to exchange contracts) | git — the suite, the mock, and the recorded evidence are plain-text files in the repo, and `git blame` is the audit record. No extra server to run, secure, and expose to both teams |
| provider states (`given('a payment exists')` handlers the provider team must implement) | the suite sets its own state through the API. The same setup runs identically against mock and provider, and the pair's precondition probe *verifies* both legs started equivalent |
| provider verification (replay recorded interactions) | the provider leg — the same functional suite, actually executed against the real service |
| `can-i-deploy` | no direct equivalent. That is Pact's broker-mediated deployment coordination — which consumer *versions* are compatible with which provider versions — and it is out of scope here. What we do answer is "is this evidence still valid?": a pair decays (`stale` / `expired`) when the spec, suite, mock or age moves, and its rung is withdrawn, never quietly kept |
| "contract tests are not functional tests" | rejected — one comprehensive functional suite does both jobs, and the pair *measures* whether it is comprehensive (`unassertedDivergence`) |

What Pact optimizes for that this kit does not: cross-team **deployment coordination** — which
consumer versions are compatible with which provider versions, decided in a broker. That is a real
concern at many-consumer scale. It is scope, not a flaw, and the two approaches are not mutually
exclusive.

## The report

**📊 See it live — no license needed to READ it.** Every push runs this kit on GitHub Actions and
publishes the HTML report (Coverage · Traceability · **Contract** · run summary) to GitHub Pages —
browse the latest at **<https://karatelabs.github.io/karate-agent-examples/checkout/>**. What to look
for:

- **Contract tab** — the `unassertedDivergence` rows are the network-casing difference (`VISA` vs
  `visa`), reported on scenarios where *both legs passed*: the deliberate demo divergence, attributed
  to the suite, with both values shown. Beside them sits the `ignored` register, where the
  surrogate-id differences are excused by named rules with a reason and an owner — and the claim
  sentence with its rung: scoped, dated and rehearsal-checked.
- **Coverage tab** — every payments operation the everyday mock lane covered reads **`mockOnly`**:
  the structural admission that day-to-day dependency evidence is mock-backed. That is exactly the
  debt the pair pays off.

`suite.karate.js` renders Coverage + Traceability; `contract.karate.js` adds the Contract page,
beside the **Governance tab** where `Openapi.grade('payments-api.yaml')` scores the `contract`
dimension as the pair's rung, normalised. The RTM joins the `CHK-*` requirements (the checkout flows)
and the `PAY-*` requirements (what this team relies on the dependency for) to the runs that exercised
them. A dependency expectation nobody wrote down is one nobody can verify a mock against — so here
they are written down.
