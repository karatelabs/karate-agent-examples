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
| `karate-async-2.1.2.RC1.jar` | the engine |
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
java -jar karate-async-2.1.2.RC1.jar serve . --port 4444
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
sides; that red is the drift detector doing its job, not test maintenance.) `check.verify(...)` records
that something **outside** the rulebook agreed with it — without it, a criterion is disclosed as
`oracleOnly`: the rulebook vouching for itself.

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
 "Rule.scenario.create('rating', { id:'senior-collision-ca', label:'senior driver over 70', state:'CA', coverage:'COLLISION', driverAge:75, priorClaims:false })"
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
  mock/                # the in-process REST mock
  config/dimensions.js # the cross / covering-array binding for POST /quotes
  karate-config.js  karate-boot.js   # config + coverage-universe wiring
  kafka/               # docker-compose + Avro schema (optional)
  rating-server/       # the standalone gRPC backend (Maven module → rating-server.jar)
```
