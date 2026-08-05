# policy-api — one insurance API across three protocols (REST · gRPC · Kafka)

A single insurance project that exercises **REST (OpenAPI)**, **gRPC**, and **Kafka** together, so one
Coverage report spans all three sources (`cov.openapi` · `cov.grpc` · `cov.kafka`).

- **gRPC is the primary, always-on backend** — a small `RatingService` (the premium engine) on `:50052`,
  no Docker. All four RPC kinds, descriptor-grade input dimensions, and the rich-error path.
- **REST (OpenAPI)** — a Policy API (quotes · policies · claims) backed by an in-process mock.
- **Kafka is the optional fourth beat** — a `policy-events` stream (Avro). It needs Docker, so it is **off
  by default**; turn it on with the `kafka/` compose file + the `cov.kafka` block in `karate-boot.js` (see section 5).

The domain ties them together: a **quote** (REST) is priced by the **rating engine** (gRPC); a bound
**policy** emits a **policy-event** (Kafka). One **rulebook** (`rulebooks/rating/`) states the pricing rules
once and is the **oracle** for every protocol — so no test in this kit pins an expected premium — and its
`calc.req` links join those rules to the **requirements** (`requirements/rating.md`), which is what turns a
run into a traceability matrix and a release verdict (section 4).

**📊 See it live — no license needed to READ it:** every push runs the REST + rules suite on GitHub Actions
and publishes the HTML report (Coverage · **Traceability RTM** · run summary) to GitHub Pages — browse the
latest at **<https://karatelabs.github.io/karate-agent-examples/policy-api/>**. Open the **Traceability**
tab: it reads **NOT READY — blocker RATE-001** (the untested senior-driver rule), and each requirement id
**clicks through to its heading in the markdown** (`requirements/rating.md`) here in this repo — the RTM is a
live, auditable artifact anyone can inspect, not a screenshot. *(The published run is REST + the run-free
rules RTM; the full REST + gRPC + Kafka cross-protocol coverage runs locally off the async jar — sections
1–5 below.)*

## What you need

Two files, sent with your license, dropped into this folder:

| file | what it is |
| --- | --- |
| `karate-async-2.1.2.RC2.jar` | the engine |
| `karate.lic` | your license |

A JDK (21+) is required (Maven too, to build the demo's gRPC backend). More: <https://karatelabs.io/agent>.

## Run

Two long-running processes — start each in its own terminal, from this folder.

**1 — the gRPC rating engine** (the always-on backend, on `:50052`):

```bash
( cd rating-server && mvn -q package )       # one-time: builds rating-server/target/rating-server.jar
java -jar rating-server/target/rating-server.jar 50052
```

> The first `mvn package` downloads dependencies and may take up to a minute with little output on a
> cold Maven cache — that's normal (a warm cache builds in seconds).
> Both processes print a `sun.misc.Unsafe … will be removed` warning from netty on newer JDKs; it is
> harmless and can be ignored.

**2 — the karate console** (off the engine jar; serves curl `/api/eval` + MCP `/api/mcp` on `:4444`):

```bash
export KARATE_LICENSE_PATH="$PWD/karate.lic"
java -jar karate-async-2.1.2.RC2.jar serve . --port 4444
```

(`KARATE_LICENSE_PATH` is just one way to point at the license — dropping it at `.karate/karate.lic`
in the project (or a parent dir) works too; see the QUICKSTART's license section for the full resolution order.)

(Reports land in `target/karate-reports` by default; pass `--report-dir <path>` to change it.)

Then drive it from a third terminal with the `curl` calls below. Stop either process with `Ctrl-C`.

### Drive it from your own AI agent (MCP)

The console also speaks **MCP** at `http://localhost:4444/api/mcp` — point any MCP-capable client (Claude
Code, Cursor, VS Code / Copilot, …) at it and ask in plain language; no key is configured on this side.
Everything the `curl` calls below do, the agent does through one tool, `karate_eval` (it runs the same JS).

```bash
# Claude Code:
claude mcp add --transport http karate http://localhost:4444/api/mcp
```

```jsonc
// or, for a client that uses an mcpServers config (Cursor, Claude Desktop, …):
{ "mcpServers": { "karate": { "url": "http://localhost:4444/api/mcp" } } }
```

Then just ask: *"connect to the gRPC RatingService on :50052, run checks/rating.feature, and show me the
coverage gaps."* Tell the agent to start with `Skill.flows()` / `help()` to discover the namespaces.

## 1. gRPC — probe the live rating engine (zero tests yet)

The `Grpc.*` namespace is live in the console. Connect once, then one verb — `g.call(method, message)` —
drives every RPC (the streaming mode is read from the proto):

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "var g = Grpc.connect({ host:'localhost', port:50052, proto:'proto/rating.proto', protoRoots:['.'], service:'RatingService' })"

curl -s -X POST localhost:4444/api/eval --data-binary "g.methods()"   # the catalog — Rate/StreamQuotes/BatchRate/Negotiate
curl -s -X POST localhost:4444/api/eval --data-binary \
 "g.call('Rate', { state:'CA', coverage:'COLLISION', driverAge:40, priorClaims:false })"
# -> { policyClass:'PREFERRED', monthlyPremium:100, currency:'USD' }     (unary)
curl -s -X POST localhost:4444/api/eval --data-binary \
 "g.call('StreamQuotes', { state:'WA', coverage:'COMPREHENSIVE', driverAge:50 })"
# -> [ {monthlyPremium:140…}, {…133…}, {…126…} ]                         (server-stream — term options)
```

Connect with **no `proto:`** to discover the shapes off the wire (server reflection). `Grpc.help()` /
`Skill.help('grpc')` is the on-ramp.

### The rich-error path — typed details on the live handle

A bad request **throws**, but the gRPC status + the rich-error model stay readable on the handle:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "try { g.call('Rate', { state:'ZZ', coverage:'LIABILITY', driverAge:40 }) } catch(e) {}"
curl -s -X POST localhost:4444/api/eval --data-binary "g.status"          # -> 'INVALID_ARGUMENT'
curl -s -X POST localhost:4444/api/eval --data-binary "g.statusDetails"   # -> { code:3, message:'unsupported state', details:[ {BadRequest fieldViolations:[state…]}, {ErrorInfo reason:'STATE_UNSUPPORTED'…} ] }
# (shorthand — each detail carries its real "@type", e.g. "type.googleapis.com/google.rpc.BadRequest")
```

## 2. Crystallize the gRPC suite + Coverage

`checks/rating.feature` drives the engine over `karate.channel('grpc')` and exercises **2 of the 4 RPCs**
on purpose (`Rate` + `StreamQuotes`), so it lands at **50% method coverage** — the gap to close:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"   # rebuild the graph from the runs/ evidence
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps()"
# -> a bare array of per-source rows (each keyed by `type`, e.g. find(r => r.type=='grpc')); that row's
#    notcovered lists RatingService/BatchRate + /Negotiate
```

`Report.aggregate()` rebuilds the traceability graph from the **run history** (every run under `runs/`)
before you query it — run, then aggregate, then read. The coverage verbs (`gaps` / `dimensions` / `summary`)
all read that graph, so call `aggregate()` again after any new run. The list verbs return **bare arrays** —
`Coverage.gaps()[0].notcovered.map(g => g.id)` just works; no unwrap. Ask an agent to author `BatchRate`
(client-streaming) + `Negotiate` (bidi) → 4/4 — for the feature-level streaming syntax over
`karate.channel('grpc')` (`session.stream` / `count` / `flush()` / `collect()`), pull `Skill.help('grpc')`.

> **Two report locations:** each `Runner.run` writes a per-run summary under `runs/<id>/` (its own
> `karate-summary.html`); the **aggregate coverage report** that spans all sources is rendered by
> `Report.generate()` under the report dir (e.g. `target/karate-reports/ext/coverage/pages/coverage.html`).
> Open the report **in place** — the HTML loads its sibling assets by relative path, so don't copy the `.html`
> out on its own. On a remote/tunneled instance the `file://` URLs the verbs return aren't clickable from
> your laptop; browse reports through the served console's **Reports** tab instead.

### Dimensions — value-class coverage within a method

`RateRequest` carries a `coverage` enum, a `prior_claims` bool, a length-bounded `state`, and a
range-bounded `driver_age` (the bounds are field options read off the proto). Each run's request fields
**reverse-infer** the partitions exercised — zero authoring:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.dimensions('grpc:RatingService/Rate')"
# coverage: LIABILITY + COLLISION exercised — COMPREHENSIVE is the gap;  driver_age: a few BVA classes; state: valid-length only
# (reads the same graph — if you have run more checks since, call Report.aggregate() first)
```

## 3. REST — the Policy API (OpenAPI)

The REST half runs against an in-process mock (`karate-config.js` auto-starts `mock/policy-mock.feature`):

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/policy.feature')"
# coverage[openapi]: createQuote + bindPolicy + listPolicies + getPolicy + fileClaim exercised
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"   # fold this run into the graph
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps()"
# -> the openapi row leaves cancelPolicy (DELETE) + getClaim (GET) as the worklist
```

The quote price mirrors the gRPC engine; the mock keeps the REST surface honest so `cov.openapi` is real.

### 3b. Contract testing — one suite, two targets, a measured divergence set

A green suite against a mock proves the suite; it says nothing about whether the mock tells consuming teams
the truth. So this kit ships the **same contract implemented twice**: `mock/policy-mock.feature` (the mock
you hand to other teams) and **`rating-server`'s REST face** — a hand-written Java implementation of the
same `openapi.yaml`, sharing the rate book with the gRPC engine and nothing else. A **paired run** runs
`checks/policy.feature` against both, in one session, in one order, and reports where they DIFFERED.

```bash
# the provider — the same rating-server.jar you already built, wearing its REST face (a THIRD terminal)
java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080

# one suite, both targets -> contract/pairs/<date>-<id>.json
java -jar karate-async-2.1.2.RC2.jar launch contract.karate.js
```

What comes back is not a pass/fail. It is a **rung** — what this evidence entitles you to say:

| | |
|---|---|
| `agreed` 12, everything else 0 | every scenario — the lifecycle AND the rejections — answered identically on both, at the verdict layer AND the response layer |
| **rung 3 of 4** (`verified-against-provider`) | the aggregate is the FLOOR of the per-operation rungs, and it is **capped** while any declared operation is unexercised — `cancelPolicy` and `getClaim` are exactly that, and the claim names them rather than rounding them up |
| **rung 4** per operation | each of the 5 operations the suite exercised is `proven-substitutable` — over the requests THIS suite sends, and no further: same answers, `seeded` data, a Background read-back that OBSERVED both legs starting equivalent, the mock this project actually ships, and a provider that carried no `Karate-Mock` header |
| 54 differences `ignored` | surrogate keys (`id` · `quoteId` · `policyId`) — each excused by a named rule carrying a **reason and an owner**, kept in the artifact with both values, never suppressed |

**A rung is only as wide as the suite.** The comparison sees exactly the requests `checks/policy.feature`
sends, so a suite of happy paths certifies a mock over happy paths. That is why the suite also sends the
rejections — an unrated territory, a coverage line we do not sell, an age outside the book, an age sent as a
string, a flag sent as a string, a quote nobody issued, a claim for nothing — and why each bar above counts
**12 scenarios**, not 5. Every one of those was a real disagreement between the two implementations before
the pair was first run: the mock said 201 where the service said 400, and for `priorClaims: "true"` the two
quoted **different premiums while both returned 201**. Nothing but a paired run finds that.

The evidence is a **dated file you commit**. `Contract.read()` derives its freshness at read time — edit the
spec, the suite or the mock and it reads `stale`, naming the binding that moved, and the rung is **withdrawn
rather than lowered**. `Openapi.grade('openapi.yaml')` reads that same file: the `contract` dimension scores
the rung normalised (3 ÷ 4 = 0.75), and the maturity level `Proven` is awarded at rung 4 and nowhere else.

> **Start the provider clean for each run.** It is an in-memory backend, so a second run against a
> still-running one compares a mock that starts empty against a provider that does not — the list endpoint
> then returns more rows on one leg than the other. That is a setup mistake, not drift, and it is the one
> the harness cannot tell apart for you. Restart the REST face before each paired run.

## 4. Requirements ⋈ rules — the RTM, and why no test pins a premium

Coverage answers *what did we exercise*. This answers *what did we promise, and is it met* — the part a
release decision actually needs.

The `rating` **rulebook** (`rulebooks/rating/`) is the executable statement of the business rules: a
`calc.js` that prices a quote, a `schema.js` input contract, and `scenarios.json` — the saved business
cases. Each decision arm names the acceptance criterion it satisfies with `calc.req('RATE-001/1')`,
pointing into `requirements/rating.md` (plain markdown, the source of truth). That link is what turns a
test run into a traceability matrix.

**The rulebook is the ORACLE, so no check in this kit pins an expected premium.** Look at
`checks/rating-acceptance.feature`: for every saved scenario it POSTs a real quote AND asks the rulebook
what the answer should be —

```gherkin
* def check = Rule.execute('rating', __row)     # the oracle: what the RULES say
Given path 'quotes'
And request { state: '#(__row.state)', ... }    # the system: a real call
When method post
Then status 201
And match response contains check.output        # no golden number, anywhere
* check.verify(true, 'live /quotes matches the rulebook')
```

A hardcoded `monthlyPremium == 100` would be a *copy* of what the rules already compute: it would need
re-pinning on every legitimate rate change, and it could never catch the one thing it looks like it is
checking — the system drifting from the rules. Here, **nothing in the suite is ever edited for a rate
change**: add a scenario and nothing is pinned; change a rate and the rows that go red are exactly the
ones where the system and the rules now disagree, each naming the requirement it violates. (The mock —
like a real backend — carries its own pricing implementation, so a rate change has to land on both
sides; that red is the drift detector doing its job, not test maintenance.) `check.verify(...)` asserts the
comparison and records that something **outside** the rulebook agreed with it — a false verdict fails the
scenario like a failed `match`, and without the call at all a criterion is disclosed as `oracleOnly`: the
rulebook vouching for itself.

Run it, then read the matrix and the release verdict:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating-acceptance.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"
curl -s -X POST localhost:4444/api/eval --data-binary "Requirement.matrix()"      # per-criterion status + covering tests
curl -s -X POST localhost:4444/api/eval --data-binary "Requirement.readiness()"   # -> NOT READY, blocker RATE-001
```

**The loop, in one move.** The saved scenarios cover the young-driver, prior-claims and territory rules —
but none sends a driver over 70, so `RATE-001/2` (the senior-driver loading) is never realized: the
requirement stays uncovered and the release verdict is **NOT READY**. The same gap shows up three ways —
`Rule.check('rating')` reports the senior arm as `notused` (fix = add data, not fix the rules),
`Requirement.gaps()` lists the criterion, `readiness()` names RATE-001 as the blocker. Close it by adding
one scenario (no new test):

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "Rule.scenario.create('rating', { _id:'senior-collision-ca', _label:'senior driver over 70', state:'CA', coverage:'COLLISION', driverAge:75, priorClaims:false })"
# re-run the SAME feature — the new row drives a real quote and realizes RATE-001/2
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating-acceptance.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate(); Requirement.readiness()"   # -> READY
```

That is the whole product in one loop: the requirement is the promise, the rulebook realizes it, a real
call proves it, and the verdict moves — with nothing to re-pin.

## 5. Kafka — the optional event side

The producer beat ships as `checks/policy-events.feature`, tagged **`@ignore`** so it never runs without a
broker up. Three steps enable it:

```bash
( cd kafka && docker compose up -d )     # 1. KRaft broker (:29092) + Schema Registry (:8081)
# 2. uncomment the cov.kafka block in karate-boot.js and restart the serve process
# 3. remove the @ignore tag at the top of checks/policy-events.feature, then run it:
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/policy-events.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps().find(r => r.type=='kafka')"
```

The produced `policy-event` (Avro `kafka/policy-event.avsc`) joins `cov.kafka` by `topic#direction` — it
lands as `policy-events#publish` **COVERED**, leaving `#subscribe` as the gap. The Avro `eventType` enum +
`rating.priorClaims` bool become reverse-inferred field-dimension axes (`Coverage.dimensions`).

## What it shows

- **One domain, three protocols, one report** — `cov.openapi` + `cov.grpc` (+ `cov.kafka`) in a single project.
- **gRPC end to end** — live probe (`Grpc.connect`) → durable suite → method coverage + the OK/error
  histogram → input dimensions → the rich-error path → the gap worklist.
- **Coverage that drives work** — `Coverage.gaps()` is the worklist (bare arrays); the report is the artifact.
- **The rulebook is the oracle** — not one check pins a premium; every row asserts the live system against
  `Rule.execute`, on REST *and* gRPC. A rate change breaks nothing; a system-vs-rules drift breaks exactly
  the rows it should, naming the requirement.
- **Requirements, joined and judged** — `calc.req` links each rule arm to an acceptance criterion, so a run
  produces an RTM and a release verdict (`Requirement.readiness()` → NOT READY, blocker RATE-001) that a
  business reader can click through to the markdown.
- **A mock proven substitutable, not assumed** — one suite against the shipped mock AND a second, foreign
  implementation of the same contract, with the divergence set measured and the claim graded as a rung
  (section 3b). Two numbers, always: what agreed, and how much of the contract that covers.

## Files

```
policy-api/
  README.md            # this file
  requirements/        # rating.md — the business promises (EARS acceptance criteria), plain markdown
  rulebooks/rating/    # the ORACLE: calc.js (rules + calc.req links) · schema.js · scenarios.json (saved cases)
  openapi.yaml         # the REST Policy API contract (coverage universe)
  proto/rating.proto   # the gRPC rating contract (coverage universe, with field bounds)
  checks/              # the .feature suites
    rating-acceptance.feature   # THE spine: every saved scenario, live vs the rulebook (the RTM)
    quotes.feature              # the covering-array combination demo (REST)
    policy.feature              # the quote → bind → claim lifecycle (OpenAPI operations)
    rating.feature              # the gRPC lane — same rulebook, second protocol
    rating-dryrun.feature  policy-events.feature
  mock/                # the in-process REST mock — and the subject of the paired run (3b)
  contract.karate.js   # the PAIRED RUN: one suite, both targets, the divergence set + the rung (3b)
  contract/pairs/      # where the evidence lands when you run it — dated, immutable, meant to be committed
  config/dimensions.js # the cross / covering-array binding for POST /quotes
  karate-config.js  karate-boot.js   # config + coverage-universe wiring
  kafka/               # docker-compose + Avro schema (optional)
  rating-server/       # the standalone backend (Maven module → rating-server.jar): the gRPC rating engine
                       #   AND PolicyServer, the REST face the paired run compares the mock against
```
