# order-pricing — the estate you already have, joined to its requirements

Most teams arrive with the same two things and no thread between them: **tests that run**, and
**requirements in some form**. This kit is that estate, and this walk is the thread — a traceability
matrix built with **no new tests**. Nothing here is authored; the only writes are tags that say *which
existing scenario checks which acceptance criterion*.

## The estate

- `requirements/order-pricing.md` — three requirements, four acceptance criteria. It names no test. Each
  criterion is linked from a decision arm in the rulebook (`calc.req('ORD-PRICE-…')`), so the rules can
  say which criteria they realize without anything running.
- `rulebooks/order-pricing/` (and `order-pricing-restricted/`) — the pricing logic as an executable
  rulebook: volume tiers, a customer-tier discount, a stacked-and-capped rate, region tax, a rush
  surcharge, and the approval routing.
- `openapi.yaml` — one operation, `createOrder` (`POST /orders`). `mock/start.js` stands up an
  in-process mock that computes every response *through the rulebook*, so the checks need no server.
- **eight feature files, not one of them tagged:**
  - `checks/orders.feature` (one outline, 3 rows) and `checks/orders-pairwise.feature` (one outline,
    5 rows) — they assert `status 201` and `response.total == '#number'`. They reach the endpoint; they
    do not check what it computed.
  - `mutation/drive/strengthened.feature` — 17 scenarios that pin the **whole** computed response
    (`subtotal`, `discount`, `tax`, `total`, `approval`) with literals derived by hand, including the
    volume-tier boundaries and the approval threshold. This is the behavioural answer key.
  - `mutation/suites/smoke.feature`, `representative.feature`, `gold.feature`, `all-echo.feature`, and
    `mutation/oracle-check.feature` — **frozen**. `mutation/manifest.json` pins each of these five by
    content hash (plus `mutation/provenance.json` and the rulebook's `calc.js`), because they are the
    measuring instrument for the mutation gate. Re-tagging them would void the freeze.

So the **linkable estate** is `checks/` plus `mutation/drive/strengthened.feature` — 25 scenarios.

## Run it

```bash
java -jar karate-agent-2.1.4.RC1.jar serve
```

Everything below is typed into that console, in this order.

## The opening matrix: what the graph knows before any test says anything

Ask the rulebook to project its own arms onto the criteria. No feature and no SUT runs: the projection
executes the rulebook's three saved scenarios through `calc` and reads which criteria the arms they reach
realize — the rules reading themselves.

```js
var before = Rule.cover('order-pricing')
before.byStatus
// { req:   { COVERED: 3, FAILING: 0, NOTRUN: 0, NOTCOVERED: 0 },
//   rules: { COVERED: 6, FAILING: 0, NOTRUN: 0, NOTCOVERED: 0 } }   // every book's rows — the restricted book projects too
before.scenarios      // -> 3
before.criteria       // -> the 4 criteria the arms name
```

```js
Requirement.matrix()
// ORD-PRICE-001  Volume discount     COVERED  oracleOnly: true
// ORD-PRICE-002  Rush surcharge      COVERED  oracleOnly: true
// ORD-PRICE-003  Approval routing    COVERED  oracleOnly: true
// all four acceptance criteria: COVERED, oracleOnly: true
// tests: ['rulebook:order-pricing::gold-volume-eu', 'rulebook:order-pricing::platinum-rush-large', …]
```

Every criterion is green, and **every green is the rulebook vouching for itself**. `oracleOnly: true` is
the engine saying so out loud: the rules realize this criterion, and nothing outside the rules has
checked it. No `.feature` scenario appears in any `tests` list. That is the estate's real starting
position — eight test files, and the requirements graph has never heard of them.

## Run A — the baseline

Run the linkable selection exactly as it stands, untagged.

```js
var a = Runner.suite(['checks', 'mutation/drive/strengthened.feature'])
a.passed        // -> 25
a.failed        // -> 0
```

```js
Requirement.matrix({ run: a.runId })
// ORD-PRICE-001  Volume discount     NOTCOVERED   tests: []
// ORD-PRICE-002  Rush surcharge      NOTCOVERED   tests: []
// ORD-PRICE-003  Approval routing    NOTCOVERED   tests: []
```

Twenty-five passing scenarios, and **this run proves nothing about any requirement**. A run's own graph
holds only what that run executed; the rulebook's projection lives in the project graph, not in here.
That is the honest baseline to improve on.

## The join

What follows is a **fixed worked example**, applied with the commands shown. It is not a proposal a model
made — it is one reading of the answer key, written down so the rest of the walk is reproducible.

The rule it follows: `@req=` means *this scenario's assertions check that criterion's behaviour*. A
scenario that merely reaches the endpoint gets `@cov=` — reach, never `@req=`.

```js
File.tag('mutation/drive/strengthened.feature',
         'Large quantity order applies a volume discount (ORD-PRICE-001)',
         { add: '@req=ORD-PRICE-001/1' })
// { path: 'mutation/drive/strengthened.feature', line: 35,
//   tags: ['@req=ORD-PRICE-001/1'], added: ['@req=ORD-PRICE-001/1'], removed: [],
//   next: ["Runner.suite('mutation/drive/strengthened.feature', {dryRun: true})"] }
```

Thirteen more calls, same shape:

| scenario | tag | why |
| --- | --- | --- |
| Large quantity order applies a volume discount (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | pins `discount: 50.0` on a 100-unit order — the tier's rate, asserted |
| Volume tier-2 boundary, exactly 10 units earns 5 percent (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | the lower tier's first qualifying quantity, with its discount pinned |
| Just below volume tier-2, 9 units earns no discount (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | the same boundary from below: no tier reached, `discount: 0.0` |
| Volume tier-1 boundary, exactly 50 units earns 10 percent (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | the upper tier's edge, its rate pinned |
| Just below volume tier-1, 49 units earns only 5 percent (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | one unit below: the *lower* tier's rate, so the tier choice is checked |
| Volume discount keys on summed quantity across lines (ORD-PRICE-001) | `@req=ORD-PRICE-001/1` | "total quantity" is the criterion's own wording — two lines summing to a tier |
| Rush order includes surcharge and costs more than non-rush (ORD-PRICE-002) | `@req=ORD-PRICE-002/1` | the same order priced both ways, surcharged total pinned and compared |
| High-value order requires manual approval (ORD-PRICE-003) | `@req=ORD-PRICE-003/1` | a total far over the threshold, `approval: 'needs-approval'` asserted |
| Total just above the 50000 threshold needs approval (ORD-PRICE-003) | `@req=ORD-PRICE-003/1` | the threshold from above, by one cent |
| Total of 60000 needs approval (ORD-PRICE-003) | `@req=ORD-PRICE-003/1` | a second routed total, independent of the boundary |
| Low-value order is auto-approved (ORD-PRICE-003) | `@req=ORD-PRICE-003/2` | well within the threshold, `approval: 'auto-approved'` asserted |
| Total exactly at the 50000 threshold auto-approves (ORD-PRICE-003) | `@req=ORD-PRICE-003/2` | the threshold from exactly on it — "within" is the criterion's word |
| quote for a `<tier>` customer in `<region>` (`checks/orders.feature`) | `@cov=openapi:createOrder` | asserts a 201 and that `total` is a number: reach, no behaviour |
| quote for a `<tier>` customer in `<region>` (rush=`<rush>`) (`checks/orders-pairwise.feature`) | `@cov=openapi:createOrder` | the same, across a pairwise spread: reach, no behaviour |

Five scenarios in the answer key are left **untagged**, and that is the other half of an honest join:

| scenario | why not |
| --- | --- |
| Create a simple order returns pricing breakdown | a one-unit smoke order; it pins a response, but no criterion's condition is what it was chosen for |
| Small order with no volume discount | a 2-unit order reaches no tier, so it checks nothing the volume criterion asserts |
| Gold tier order returns valid pricing shape | customer-tier discounts are rulebook behaviour no requirement asks for |
| Multi-item order sums subtotal across items | subtotal arithmetic; unrequired |
| Platinum plus volume stacks to the 25 percent cap boundary | the discount cap; no acceptance criterion mentions a cap |

Tagging a scenario because it happens to pass is how a matrix turns into decoration.

## Run B, and the delta

```js
var b = Runner.suite(['checks', 'mutation/drive/strengthened.feature'])
b.passed        // -> 25
b.failed        // -> 0
```

```js
Requirement.delta({ from: { run: a.runId }, to: { run: b.runId } })
// measures: 'evidence', requirementsAsOf: 'current', oracle: 'project'
// criteria.moved: []
// criteria.corroborated: { oracleOnly: [ 'ORD-PRICE-001/1', 'ORD-PRICE-002/1',
//                                        'ORD-PRICE-003/1', 'ORD-PRICE-003/2' ],
//                          refusalOnly: [] }
// criteria.declared: [ 'ORD-PRICE-001/1', 'ORD-PRICE-002/1', 'ORD-PRICE-003/1', 'ORD-PRICE-003/2' ]
// criteria.undeclared: []   lost: []   regressed: []   added: []   removed: []
// counts: { from: { covered: 3, failing: 0, notrun: 0, notcovered: 1 },
//           to:   { covered: 3, failing: 0, notrun: 0, notcovered: 1 },
//           net:  { covered: 0, failing: 0, notrun: 0, notcovered: 0 } }
// improved: true
```

`oracle: 'project'` is the delta saying each side is that run's graph **plus the rulebook's run-free
projection** — the same one the opening matrix showed. It is identical on both sides, so it moves nothing;
what it does is put the estate's real before-state into the comparison. So every criterion is COVERED on
both sides and `moved` is empty. What the verb reports instead is the two things the join actually did:
`declared` — four claims that are on the `to` side and were on no run before — and the **clearance**: those
same four criteria no longer rest on the rulebook's word alone.

`measures: 'evidence'` because both sides are executed runs of the same files — the only difference
between them is the tags. `improved: true` means something climbed *or was corroborated*, and **nothing
regressed**: a linked scenario that fails takes its criterion to FAILING and lands in `regressed`, and the
fix is to inspect the failure, not to delete the tag. A *wrong* mapping on a scenario that passes is not
detected — it stays green, and the graph records the claim as made. That is the fence: the delta grades
that a scenario claims a criterion, never that the claim is true. Same two runs, same 25 scenarios, same
25 passes — the join is the whole difference.

## The after matrix

```js
Requirement.matrix()
// ORD-PRICE-001  Volume discount     COVERED   tests: 6 scenarios in strengthened.feature + the rulebook rows
// ORD-PRICE-002  Rush surcharge      COVERED   tests: 1 scenario  in strengthened.feature + the rulebook rows
// ORD-PRICE-003  Approval routing    COVERED   tests: 5 scenarios in strengthened.feature + the rulebook rows
// no oracleOnly on any row
```

Compare that with the opening matrix. The statuses did not move — they were already COVERED — but
`oracleOnly` is gone from all three rows, and every row now names the scenarios that back it. That
clearance *is* the result: the rulebook is no longer the only witness.

The two `checks/` outlines are in neither list, and that is correct:

```js
Coverage.status('openapi:createOrder')
// status: 'COVERED', requirements: [], mockOnly: true
```

The endpoint is reached, no requirement hangs off it, and the graph discloses that a mock answered.
`@cov=` bought exactly what those outlines are worth.

```js
Requirement.readiness()
// ready: true, state: 'READY', verdict: 'READY'
// counts: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 3 }, blockers: []
```

## Green nobody checked

The scorecard says every requirement has a passing test that says "I check this". It does not say the
test checks anything. Make that concrete: copy the frozen status-only smoke suite in beside the checks —
three scenarios whose whole assertion budget is `Then status 201` — and tag its three orders onto the
criteria they touch.

```js
File.copy('mutation/suites/smoke.feature', 'checks/smoke.feature')
// 'copied: mutation/suites/smoke.feature -> checks/smoke.feature'
```

```js
File.tag('checks/smoke.feature', 'a standard US order is accepted',
         { add: '@req=ORD-PRICE-001/1' })
// { path: 'checks/smoke.feature', line: 12,
//   tags: ['@req=ORD-PRICE-001/1'], added: ['@req=ORD-PRICE-001/1'], removed: [],
//   next: ["Runner.suite('checks/smoke.feature', {dryRun: true})"] }
```

Two more calls, same shape: `a gold EU order is accepted` → `@req=ORD-PRICE-002/1`, and
`a platinum APAC order is accepted` → `@req=ORD-PRICE-003/2`.

```js
var c = Runner.suite('checks/smoke.feature')
c.passed        // -> 3
c.failed        // -> 0
```

```js
Requirement.matrix({ run: c.runId })
// ORD-PRICE-001/1  volume tier      COVERED   notasserted: true   assertedProportion: 0
// ORD-PRICE-002/1  rush surcharge   COVERED   notasserted: true   assertedProportion: 0
// ORD-PRICE-003/2  auto-approve     COVERED   notasserted: true   assertedProportion: 0
// runEvidence.assertionStrength: { graded: 3, ungraded: 0, notasserted: 3 }
```

Three green scenarios, three criteria claimed, and every row says out loud that nothing in the response
was checked. The tag is exactly as valid as the one the answer key carries — the graph does not argue
with it; it grades it. `notasserted` is a disclosure beside the status, the same way `oracleOnly` was.

```js
Requirement.matrix()
// ORD-PRICE-001/1  COVERED   assertedProportion: 1
// ORD-PRICE-002/1  COVERED   assertedProportion: 1
// ORD-PRICE-003/2  COVERED   assertedProportion: 1
// no notasserted on any row
```

In the project graph the same three criteria read checked. Per criterion the strongest covering test
wins, and on each of these three the answer key's scenarios pin the computed values — so the smoke copy
adds a claim and takes nothing away. A run's reading and the estate's are two different questions, and
the run-scoped matrix is the one that finds the hollow suite.

Linking grades whether a test *claims* a criterion; assertion strength grades how well — `0` nothing
asserted, `0.5` weak or unmeasured, `1` a locked value or shape — and a `match` that locks a value or a
shape clears the bucket. What fraction of a response's fields a test pins, and where its expected value
came from, are not measured: the frozen mutation corpus remains the adequacy measurement.

What a model does with the `link` skill is this same loop with the proposal step done by the model
instead of read off a table. That the model can do it is a claim made by the cold-agent gate, not by this
walk.
