# policy-api — one insurance API across three protocols (REST · gRPC · Kafka)

One insurance project that exercises **REST (OpenAPI)**, **gRPC** and **Kafka** together, so one
Coverage report spans all three sources (`cov.openapi` · `cov.grpc` · `cov.kafka`).

- **gRPC is the primary, always-on backend** — a small `RatingService` (the premium engine) on
  `:50052`, no Docker. All four RPC kinds, input dimensions read off the proto, and the rich-error path.
- **REST (OpenAPI)** — a Policy API (quotes · policies · claims) backed by an in-process mock.
- **Kafka is the optional fourth part** — a `policy-events` stream (Avro). It needs Docker, so it is
  **off by default**. Section 5 shows how to turn it on.

The domain ties the protocols together. A **quote** (REST) is priced by the **rating engine** (gRPC).
A bound **policy** emits a **policy-event** (Kafka). One **rulebook** (`rulebooks/rating/`) states the
pricing rules once and is the **oracle** for every protocol — so no test in this kit pins an expected
premium. The rulebook's `calc.req` links join those rules to the **requirements**
(`requirements/rating.md`). That link is what turns a run into a traceability matrix and a release
verdict (section 4).

**📊 See it live — no license needed to READ it.** Every push runs the REST + rules suite on GitHub
Actions and publishes the HTML report (Coverage · **Traceability RTM** · **Contract** · run summary)
to GitHub Pages: **<https://karatelabs.github.io/karate-agent-examples/policy-api/>**. Two things to
look at:

- The **Traceability** tab reads **NOT READY — blocker RATE-001** (the untested senior-driver rule).
  Each requirement id links to its heading in `requirements/rating.md`, here in this repo. The RTM is
  a live artifact anyone can audit, not a screenshot.
- The **Contract** tab shows a **paired run**: the same CI job starts this kit's Java backend and runs
  one suite against both the mock and that second, independent implementation, so the published
  divergence set between the two is browsable (section 3b).

The published run covers all of it: the CI job runs the REST suite + rules RTM + the pair on the
container image, then runs the **full cross-protocol lane** off the `karate-async` engine jar — the gRPC
rating engine and a real Kafka broker are stood up in the job — so the published Coverage tab spans
**REST + gRPC + Kafka in one report**. The same lane runs locally in one command (see section 5's
one-shot); sections 1–5 below walk it beat by beat.

## What you need

Two files, sent with your license, dropped into this folder:

| file | what it is |
| --- | --- |
| `karate-async-21.5.0.jar` | the engine |
| `karate.lic` | your license |

A JDK (21+) is required, and Maven to build the demo's gRPC backend. More: <https://karatelabs.io/agent>.

## Run

Start two long-running processes, each in its own terminal, from this folder.

**1 — the gRPC rating engine** (the always-on backend, on `:50052`):

```bash
( cd rating-server && mvn -q package )       # one-time: builds rating-server/target/rating-server.jar
java -jar rating-server/target/rating-server.jar 50052
```

> The first `mvn package` downloads dependencies. On a cold Maven cache it can take up to a minute
> with little output; a warm cache builds in seconds. Both processes print a
> `sun.misc.Unsafe … will be removed` warning from netty on newer JDKs — it is harmless.

**2 — the karate console** (off the engine jar; serves curl `/api/eval` + MCP `/api/mcp` on `:4444`):

```bash
export KARATE_LICENSE_PATH="$PWD/karate.lic"
java -jar karate-async-21.5.0.jar serve . --port 4444
```

`KARATE_LICENSE_PATH` is one way to point at the license. A `karate.lic` file at `.karate/karate.lic`
in the project (or a parent folder) works too; the QUICKSTART's license section has the full
resolution order.

Reports land in `target/karate-reports` by default; pass `--report-dir <path>` to change it.

Then drive the console from a third terminal with the `curl` calls below. Stop either process with
`Ctrl-C`.

### Drive it from your own AI agent (MCP)

The console also speaks **MCP** at `http://localhost:4444/api/mcp`. Point any MCP-capable client
(Claude Code, Cursor, VS Code / Copilot, …) at it and ask in plain language; no key is configured on
this side. Everything the `curl` calls below do, an agent does through one tool, `karate_eval` — it
runs the same JS.

```bash
# Claude Code:
claude mcp add --transport http karate http://localhost:4444/api/mcp
```

```jsonc
// or, for a client that uses an mcpServers config (Cursor, Claude Desktop, …):
{ "mcpServers": { "karate": { "url": "http://localhost:4444/api/mcp" } } }
```

Then ask: *"connect to the gRPC RatingService on :50052, run checks/rating.feature, and show me the
coverage gaps."* Tell the agent to start with `Skill.flows()` / `help()` to discover the namespaces.

## 1. gRPC — probe the live rating engine (zero tests yet)

The `Grpc.*` namespace is live in the console. Connect once. Then one verb — `g.call(method, message)`
— drives every RPC; the engine reads the streaming mode from the proto:

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

Connect with **no `proto:`** and the engine discovers the shapes off the wire (server reflection).
`Grpc.help()` / `Skill.help('grpc')` is the on-ramp.

### The rich-error path — typed details on the live handle

A bad request **throws**, but the gRPC status and the rich-error model stay readable on the handle:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "try { g.call('Rate', { state:'ZZ', coverage:'LIABILITY', driverAge:40 }) } catch(e) {}"
curl -s -X POST localhost:4444/api/eval --data-binary "g.status"          # -> 'INVALID_ARGUMENT'
curl -s -X POST localhost:4444/api/eval --data-binary "g.statusDetails"   # -> { code:3, message:'unsupported state', details:[ {BadRequest fieldViolations:[state…]}, {ErrorInfo reason:'STATE_UNSUPPORTED'…} ] }
# (shorthand — each detail carries its real "@type", e.g. "type.googleapis.com/google.rpc.BadRequest")
```

## 2. The gRPC suite + Coverage

`checks/rating.feature` drives the engine over `karate.channel('grpc')`. On purpose, it exercises only
**2 of the 4 RPCs** (`Rate` + `StreamQuotes`), so it lands at **50% method coverage** — the gap to
close.

> **The feature is tagged `@grpc` because it needs a protocol leaf the lean engine does not carry.**
> Run the kit on an engine that bundles the protocols (the `karate-async` jar — mount it into the
> container's `/jars` to swap the engine), or select around the tag:
> `Runner.run('checks', {tags:'~@grpc'})`. On the lean engine the feature fails with
> *"cannot find [grpc]"* — an absent capability, not a broken one, and nothing else in the kit
> depends on it.

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"   # rebuild the graph from the runs/ evidence
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps()"
# -> a bare array of per-source rows (each keyed by `type`, e.g. find(r => r.type=='grpc')); that row's
#    notcovered lists RatingService/BatchRate + /Negotiate
```

`Report.aggregate()` rebuilds the traceability graph from the run history (every run under `runs/`).
The order is: run, then aggregate, then read. The coverage verbs (`gaps` / `dimensions` / `summary`)
all read that graph, so call `aggregate()` again after any new run. The list verbs return **bare
arrays** — `Coverage.gaps()[0].notcovered.map(g => g.id)` just works, no unwrap.

To reach 4/4, ask an agent to author `BatchRate` (client-streaming) and `Negotiate` (bidi). For the
feature-level streaming syntax over `karate.channel('grpc')` (`session.stream` / `count` / `flush()` /
`collect()`), pull `Skill.help('grpc')`.

> **Two report locations.** Each `Runner.run` writes a per-run summary under `runs/<id>/` (its own
> `karate-summary.html`). The **aggregate coverage report** that spans all sources is rendered by
> `Report.generate()` under the report dir (e.g. `target/karate-reports/ext/coverage/pages/coverage.html`).
> Open the report **in place** — the HTML loads its sibling assets by relative path, so don't copy the
> `.html` out on its own. On a remote or tunneled instance the `file://` URLs the verbs return are not
> clickable from your laptop; browse reports through the served console's **Reports** tab instead.

### Dimensions — value-class coverage within a method

`RateRequest` carries a `coverage` enum, a `prior_claims` bool, a length-bounded `state`, and a
range-bounded `driver_age` (the bounds are field options read off the proto). From each run's request
fields the engine **reverse-infers** the partitions exercised — zero authoring:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.dimensions('grpc:RatingService/Rate')"
# coverage: LIABILITY + COLLISION exercised — COMPREHENSIVE is the gap;  driver_age: a few BVA classes; state: valid-length only
# (reads the same graph — if you have run more checks since, call Report.aggregate() first)
```

## 3. REST — the Policy API (OpenAPI)

The REST half runs against an in-process mock (`karate-config.js` auto-starts
`mock/policy-mock.feature`):

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/policy.feature')"
# coverage[openapi]: createQuote + bindPolicy + listPolicies + getPolicy + fileClaim exercised
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"   # fold this run into the graph
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps()"
# -> the openapi row leaves cancelPolicy (DELETE) + getClaim (GET) as the worklist
```

The quote price mirrors the gRPC engine. The mock keeps the REST surface honest, so `cov.openapi` is
real.

### 3b. Contract testing — one suite, two targets, a measured divergence set

A green suite against a mock proves the suite. It says nothing about whether the mock tells consuming
teams the truth. So this kit ships the **same contract implemented twice**: `mock/policy-mock.feature`
(the mock you hand to other teams) and `rating-server`'s REST face — a hand-written Java
implementation of the same `openapi.yaml`. The two share the rate book and nothing else. A **paired
run** executes `checks/policy.feature` against both, in one session, in one order, and reports where
they differed.

```bash
# the provider — the same rating-server.jar you already built, wearing its REST face (a THIRD terminal)
java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080

# one suite, both targets -> contract/pairs/<date>-<id>.json
java -jar karate-async-21.5.0.jar launch contract.karate.js

# ...against a deployed provider instead of the local one — the same file, nothing edited
PROVIDER_URL=https://policy.staging.example.com PROVIDER_ENV=staging \
  java -jar karate-async-21.5.0.jar launch contract.karate.js
```

`contract.karate.js` reads both variables with `Settings.sysenv(name, default)`. The local run needs
no environment at all; CI sets one variable. `PROVIDER_ENV` is a label that rides into the evidence —
a pair recorded against staging should not read later as if it came from a laptop.

The paired run also renders a **Contract page** (`Contract.report`) into the report dir, beside
Coverage and Traceability. That page is what the CI job publishes as the **Contract** tab of the live
site linked above. The page shows what `Contract.read` returns and derives nothing of its own, so the
page and the verb cannot disagree. Freshness is computed at read time, so the page is a snapshot at
the instant it was rendered (it says so), not a live badge.

**In CI this step is the parity gate.** The two implementations are only known to agree because a pair
says so — and they have disagreed before (a coerced field, a blank string, an empty body: each found
this way, then aligned on both sides). Nothing else in the pipeline builds `rating-server`, so the
workflow that records a pair on every push is what stops the mock and the provider drifting apart
unnoticed.

What comes back is not a pass/fail. It is a **rung** — what this evidence entitles you to say:

| | |
|---|---|
| `agreed` 12, everything else 0 | every scenario — the lifecycle and the rejections — answered identically on both targets, at the verdict layer and the response layer |
| **rung 3 of 4** (`verified-against-provider`) | the aggregate rung is the floor of the per-operation rungs, and it stays capped while any declared operation is unexercised. `cancelPolicy` and `getClaim` are unexercised, and the claim names them instead of rounding up |
| **rung 4** per operation | each of the 5 exercised operations is `proven-substitutable` — over the requests this suite sends, and no further. Both targets returned the same answers on `seeded` data. A Background read-back observed both legs starting equal. The mock is the one this project actually ships, and the provider carried no `Karate-Mock` header |
| 54 differences `ignored` | surrogate keys (`id` · `quoteId` · `policyId`) — each excused by a named rule with a **reason and an owner**. Both values stay in the artifact; nothing is suppressed |

**A rung is only as wide as the suite.** The comparison sees exactly the requests
`checks/policy.feature` sends, so a suite of happy paths certifies a mock over happy paths only. That
is why the suite also sends the rejections: an unrated territory, a coverage line we do not sell, an
age outside the book, an age sent as a string, a flag sent as a string, a quote nobody issued, a claim
for nothing. That is why each bar above counts **12 scenarios**, not 5. Every one of those rejections
was a real disagreement before the pair was first run: the mock said 201 where the service said 400,
and for `priorClaims: "true"` the two quoted **different premiums while both returned 201**. Only a
paired run finds that.

The evidence is a **dated file you commit**. `Contract.read()` derives freshness at read time: edit
the spec, the suite or the mock, and the pair reads `stale`, naming the binding that moved — the rung
is **withdrawn**, not lowered. `Openapi.grade('openapi.yaml')` reads the same file: the `contract`
dimension scores the rung normalised (3 ÷ 4 = 0.75), and the maturity level `Proven` is awarded at
rung 4 and nowhere else.

> **Restart the provider before each paired run.** It is an in-memory backend. A second run against a
> still-running provider compares a mock that starts empty against a provider that does not — the list
> endpoint then returns more rows on one leg than the other. That is a setup mistake, not drift, and
> the harness cannot tell them apart for you.

### 3c. A suite against the real backend

`karate.env=backend` points every run at the REST face on `http://localhost:8080` (`-DbackendUrl=<url>`
moves it) instead of the mock:

```bash
java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080
KARATE_ENV=backend java -jar karate-async-21.5.0.jar serve . --port 4444
```

```js
Runner.run('suites/ai')
// without the senior-driver loading -> 63 passed (with it, the 3 senior rows fail). Coverage: every operation called, createQuote 12 of 30 combinations.
//    Traceability: no requirement covered, NOT READY, blocker RATE-001
```

`suites/ai/` is the suite a coding agent wrote for the backend it built, captured verbatim
(`drive/transcript.jsonl`). Its expected premiums come from that code, so against a backend without the
senior-driver loading (`patch -p1 -R < fix/senior-loading.patch`, then rebuild `rating-server`) it is
still green, drivers over 70 included. A rulebook row, `Rule.execute('rating', { state: 'CA', coverage:
'COLLISION', driverAge: 75, priorClaims: false })` asserted against `POST /quotes`, fails there: actual
100, expected 125. `patch -p1 < fix/senior-loading.patch` and a rebuild is the fix: that row passes, and
the suite's own three senior rows fail on the premiums they copied from the code. That row plus
`checks/rating-acceptance.feature` reads READY.

### 3d. The same API from Postman

`postman/policy-api.postman_collection.json` is a Postman collection of the same lifecycle, with `pm.test`
checks on every request. It takes `baseUrl` from `karate-config.js`, so it runs against the mock, or
against the REST face under `karate.env=backend`:

```js
Runner.run('postman/policy-api.postman_collection.json')
// -> 13 passed: quote, bind, read, list, file and read a claim, cancel, and the 400 / 404 paths
```

### 3e. The pull-request check

`Report.gate({spec: 'openapi.yaml'})` is the check a pull request posts: the readiness verdict and the
spec's lint as one conclusion. `lint-waivers.yaml` (declared as `cov.lintWaivers` in `karate-boot.js`)
waives `security-scheme-declared` with a reason and an owner. Every lint surface applies it, and the gate
summary and the Governance tab list it. After the fix and the senior row, the gate reads READY; the
remaining lint warnings make it `neutral`, which does not block a merge.

## 4. Requirements ⋈ rules — the RTM, and why no test pins a premium

Coverage answers *what did we exercise*. This section answers *what did we promise, and is it met* —
the part a release decision actually needs.

The `rating` **rulebook** (`rulebooks/rating/`) is the executable statement of the business rules:
`calc.js` prices a quote, `schema.js` is the input contract, and `scenarios.json` holds the saved
business cases. Each decision arm names the acceptance criterion it satisfies with
`calc.req('RATE-001/1')`, pointing into `requirements/rating.md` (plain markdown, the source of
truth). That link is what turns a test run into a traceability matrix.

**The rulebook is the ORACLE, so no check in this kit pins an expected premium.** Look at
`checks/rating-acceptance.feature`: for every saved scenario it POSTs a real quote AND asks the
rulebook what the answer should be —

```gherkin
* def check = Rule.execute('rating', __row)     # the oracle: what the RULES say
Given path 'quotes'
And request { state: '#(__row.state)', ... }    # the system: a real call
When method post
Then status 201
And match response contains check.output        # no golden number, anywhere
* check.verify(true, 'live /quotes matches the rulebook')
```

A hardcoded `monthlyPremium == 100` would be a copy of what the rules already compute. It would need
re-pinning on every legitimate rate change, and it could never catch the one thing it appears to
check: the system drifting from the rules. Here, nothing in the suite is ever edited for a rate
change. Add a scenario, and nothing is pinned. Change a rate, and the rows that go red are exactly the
rows where the system and the rules now disagree — each names the requirement it violates. (The mock,
like a real backend, carries its own pricing implementation, so a rate change must land on both sides.
That red is the drift detector working, not test maintenance.)

`check.verify(...)` asserts the comparison and records that something **outside** the rulebook agreed
with it. A false verdict fails the scenario like a failed `match`. Without the call, the criterion is
disclosed as `oracleOnly`: the rulebook vouching for itself.

Run it, then read the matrix and the release verdict:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating-acceptance.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"
curl -s -X POST localhost:4444/api/eval --data-binary "Requirement.matrix()"      # per-criterion status + covering tests
curl -s -X POST localhost:4444/api/eval --data-binary "Requirement.readiness()"   # -> NOT READY, blocker RATE-001
```

**The loop, in one move.** The saved scenarios cover the young-driver, prior-claims and territory
rules — but none sends a driver over 70, so `RATE-001/2` (the senior-driver loading) is never
realized. The requirement stays uncovered and the release verdict is **NOT READY**. The same gap shows
up three ways: `Rule.check('rating')` reports the senior arm as `notused` (the fix is data, not
rules), `Requirement.gaps()` lists the criterion, and `readiness()` names RATE-001 as the blocker.
Close it by adding one scenario — no new test:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "Rule.scenario.create('rating', { _id:'senior-collision-ca', _label:'senior driver over 70', state:'CA', coverage:'COLLISION', driverAge:75, priorClaims:false })"
# re-run the SAME feature — the new row drives a real quote and realizes RATE-001/2
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/rating-acceptance.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate(); Requirement.readiness()"   # -> READY
```

That is the whole product in one loop: the requirement is the promise, the rulebook realizes it, a
real call proves it, and the verdict moves — with nothing to re-pin.

## 5. Kafka — the optional event side

The producer beat ships as `checks/policy-events.feature`, tagged **`@kafka`** (like `@grpc` on the
gRPC lane: it needs a protocol leaf plus a live backend, so select around it — `{tags:'~@kafka'}` — in
any sweep that lacks them). On this engine the **coverage universe is always declared** — a run that
never touches Kafka honestly shows `policy-events#publish` / `#subscribe` as red rows, the same way an
untested gRPC method shows red. *Exercising* it is the explicit **opt-in**: the `KARATE_KAFKA_ON` flag
(env, or a `-D` sysprop) makes `karate-boot.js` boot the kafka ext and switches the universe to the
registry-backed shape (the `policy-event` Avro fields then become reverse-inferred dimensions).

```bash
( cd kafka && docker compose up -d )     # 1. KRaft broker (:29092) + Schema Registry (:8081)
# 2. restart the serve process with the flag on:
KARATE_KAFKA_ON=1 java -jar karate-async-21.5.0.jar serve . --port 4444
# 3. run the producer beat:
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('checks/policy-events.feature')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps().find(r => r.type=='kafka')"
```

### The one-shot cross-protocol lane

With the gRPC rating engine (`:50052`) and the Kafka stack up, one command runs the whole kit — REST +
gRPC + Kafka + the acceptance RTM — and renders one report spanning all three protocols (this is the
exact lane CI runs to produce the published GitHub Pages report):

```bash
KARATE_GRPC_ON=1 KARATE_KAFKA_ON=1 \
  java -jar karate-async-21.5.0.jar launch suite.karate.js
open target/karate-reports/ext/coverage/pages/coverage.html
```

`KARATE_GRPC_ON` adds the gRPC suite to the launch and `KARATE_KAFKA_ON` adds the producer beat (and
switches the kafka ext on) — both are opt-ins because each needs its backend running.

The produced `policy-event` (Avro, `kafka/policy-event.avsc`) joins `cov.kafka` by `topic#direction`.
It lands as `policy-events#publish` **COVERED**, leaving `#subscribe` as the gap. The Avro `eventType`
enum and the `rating.priorClaims` bool become reverse-inferred field-dimension axes
(`Coverage.dimensions`).

## 6. PolicyDesk — the same rules, checked on a screen

PolicyDesk (`sut/`) is an underwriting desk over the Policy API: find accounts and policies, a
submissions list, a quote wizard (Driver, Vehicle, Coverage), a rating worksheet with the premium
build-up, Bind, the policy with its claims, and Documents. Every action is a call to the API, on the
same origin that served the page. The REST face serves it when you name the folder:

```bash
java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080 sut
# -> open http://localhost:8080/desk/
```

`checks/cases.xlsx` (sheet `quotes`) holds eight cases: young, senior, prior claims, the age-70
boundary, every territory. `checks/desk-cases.feature` runs `checks/desk-quote.js` once per row: it
drives the wizard to a bound policy and compares the worksheet and policy premiums with
`Rule.execute('rating', row)`. A spreadsheet cell reads back as text, so the check turns `driverAge`
into a number and `priorClaims` (`Yes`/`No`) into a boolean before rating. A passing row records a
verdict against the RATE criteria its rating reached.

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "Runner.run('checks/desk-cases.feature')"
# -> 8 passed
```

The check opens a browser. It finds PolicyDesk at `http://localhost:8080/desk/` on bare metal and at
`http://host.docker.internal:8080/desk/` in the `karate-agent` container; `desk.url` overrides either.
`{env: 'backend'}` finds the REST face on the same host (`backendUrl` overrides it).

PolicyDesk follows the OS's light or dark setting. `?theme=dark` or `?theme=light` in the page URL pins
it, and the `desk.theme` prop does the same for every check and migrated UI feature that opens it.

Two seeded UI defects, off unless named in `desk.defects` (or in the page URL, `?defects=`):

| `desk.defects` | what changes | what the run shows |
| --- | --- | --- |
| `display` | the worksheet totals its own build-up, which has no Florida territory factor | exactly the Florida row fails: `Worksheet premium $140 = rules $155` |
| `drift` | the coverage step's **Rate quote** button becomes **Calculate premium**, with a new id | every row fails at that button: a check never heals a locator on its own |

For `drift`, pick `checks/desk-quote.js` in the console's run dialog, tick **Run with AI**, and fill
**props** with `desk.defects=drift`. The same run over eval:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "Harness.heal('desk-quote.js', {props: {'desk.defects': 'drift'}})"
```

It re-drives the flow on the live page and repairs the one changed locator in the check,
`#rate-quote` → `#coverage-rate-quote-btn`, leaving the assertions as they were. Driven from the console without a check, the bot re-targets the same
button itself and says so in the act's `healed` field.
A flow you record on PolicyDesk in the console counts in Coverage: the API operations it called
read as exercised by that recording. The same recording becomes two tests:

- **A UI test.** At `/manual/tests/new`, or `Harness.author('<recording runId>', {name: 'desk-senior-fl'})`:
  a model writes `checks/desk-senior-fl.js` and runs it until it is green.
- **An API test.** `Traffic.migrate('<recording runId>')` turns the calls the screen made into a
  candidate feature, and `ApiTest.land` writes it once it runs green (`Skill.help('record-to-api')`).
  Chain the ids it returns, and assert the premium against `Rule.execute('rating', input)`, so the test
  covers the RATE criteria its rating reaches.

With no recording and no selectors, `checks/explore-desk.md` is a goal in plain English: quote a
72-year-old Texas driver, bind, and file a claim. A model drives PolicyDesk to it, with screenshots and a
video on the run's report:

```bash
curl -s -X POST localhost:4444/api/eval --data-binary \
 "Harness.explore('explore-desk.md', {robot: true, async: true, req: 'RATE-001'})"
```

The senior row realizes `RATE-001/2`, so a run of this feature moves the release verdict too.

## 7. Migrate a legacy estate

`legacy/` holds tests written for this kit in other frameworks: a REST-assured class, a ReadyAPI
project and a Playwright API-mode spec against the API, and a Selenium class (with page objects) and
a Playwright spec that drive PolicyDesk. `suites/migrated/` holds their Karate migration, written by a
coding agent over MCP from the prompt *"Migrate the tests in legacy/ to Karate. Run them until they
pass."*: one scenario per source test with every assertion kept, each feature tagged
`@imported-from-<source>`. The UI features call the page checks in `checks/pages/`.
`suites/migrated/manifest.json` records the session, and `suites/migrated/drive/` holds its transcript.

```bash
curl -s -X POST localhost:4444/api/eval --data-binary "Skill.help('migration')"
curl -s -X POST localhost:4444/api/eval --data-binary "Runner.run('suites/migrated')"
curl -s -X POST localhost:4444/api/eval --data-binary "Report.aggregate()"
curl -s -X POST localhost:4444/api/eval --data-binary "Coverage.gaps()"
```

The UI features need PolicyDesk at `deskUrl` and a browser, as in section 6.

## 8. Follow the full-tour video, chapter by chapter

The video starts with the backend **without** the senior-driver loading; this kit ships with it. Reverse
the fix, rebuild, and start the three processes (each in its own terminal):

```bash
patch -p1 -R < fix/senior-loading.patch && ( cd rating-server && mvn -q package )
java -jar rating-server/target/rating-server.jar 50052
java -cp rating-server/target/rating-server.jar io.karatelabs.examples.insurance.PolicyServer 8080 sut
java -jar karate-async-21.5.0.jar serve . --port 4444
```

Send each line below with `curl -s -X POST localhost:4444/api/eval --data-binary "<js>"`. Runs against the
backend pass `{env: 'backend'}`.

| chapter | run | you see |
| --- | --- | --- |
| The agent says done | `Runner.run('suites/ai', {env: 'backend'})` | 63 of 63 green; its senior rows expect the backend's prices (age 71 and 80 → 50) |
| The business plays the API | `var m = Http.mock({twin: 'rating', record: true, port: 8099}); Http.app({twin: 'rating', target: m, console: 'http://localhost:4444', port: 8100})`, open `:8100` | a quote reads *Quoted*, $100; Cancel and File a claim read *Not available* with the reason; a second claim is *Refused*, `claim_already_open`. Rules › rating › *Compare with API spec*: 93 differences, 93 accepted, 0 open |
| Spec in, project out | Checks › scaffold from `openapi.yaml` | 5 files in `openapi-tests/`; served as its own project, its starter test passes 3 of 3 on the spec's mock |
| Migrate | Checks › migration map; `Runner.run('suites/migrated')` | 15 old tests → 15 scenarios, 60 checks → 60; 15 of 15 green on the mock; Coverage openapi 5/7. With `env: 'backend'`, unsolved: 14 of 15, the old senior Florida test fails (155, expected 180) |
| Covered, or just called? | the first run's Coverage tab; `Report.aggregate()` then `Coverage.dimensions('openapi:createQuote')` | every operation called (openapi 7/7), evidence *observed*; 12 of 30 pricing combinations; error paths 6/7; a 4-row pairwise deck |
| Requirements, traced | `Requirement.readiness({run: '<runId>'})`; `Runner.run('checks/rating-acceptance.feature', {env: 'backend'})` | NOT READY, blocker RATE-001; the acceptance run covers RATE-001/1, RATE-002/1, RATE-003/1 and leaves RATE-001/2 |
| The rules are the answer key | Rules › rating › Health | *Senior-driver loading* NOT USED, *Catastrophe reinsurance surcharge* NOT REACHABLE, *premium never below base rate* HOLDS |
| Would your tests notice? | `Rule.mutate('rating', {suite: 'suites/ai', operation: 'createQuote', handlers: 'mutation/handlers.js', provenance: 'mutation/provenance.json'})`, then again with `expectedFailures` set to the returned `failures`; or both in one click: the run dialog's `mutate.karate.js` | refused first: 3 rows agree with the *Senior-driver loading* mutant (RATE-001/2); then 15 killed, 1 survived, 2 screened, counterexample CA COLLISION age 75, expected 125 |
| A real bug | `Rule.scenario.create('rating', {_id: 'senior-collision-ca', _label: 'senior driver over 70', state: 'CA', coverage: 'COLLISION', driverAge: 75, priorClaims: false})`, rerun the acceptance feature | the senior row is red: actual 100, expected 125 |
| The fix | `patch -p1 < fix/senior-loading.patch`, rebuild, restart both servers, rerun | the acceptance feature 4 of 4, READY; `suites/ai` 60 of 63 (its three senior rows expected the bug) |
| The mock that proves itself | restart PolicyServer, then `Runner.launch('contract.karate.js', {props: {'contract.suite': 'suites/ai'}})` | 59 matched, 1 difference no assertion checks (*priorClaims as string*: the two error texts differ), rung 1 of 4 |
| Every protocol | `Runner.run('checks/rating.feature')`; `Runner.run('postman/policy-api.postman_collection.json')` | gRPC 2 of 4 methods (BatchRate, Negotiate open); Postman 13 of 13 |
| Enterprise UI | `Runner.run('checks/desk-cases.feature')`, then with `{props: {'desk.defects': 'display'}}` | 8 of 8; then the Florida row fails, worksheet $140 against rules $155 |
| The gate | `Report.gate({spec: 'openapi.yaml'})` | READY, 17 lint warnings: neutral, with the `security-scheme-declared` waiver |

## What it shows

- **One domain, three protocols, one report** — `cov.openapi` + `cov.grpc` (+ `cov.kafka`) in a single
  project.
- **gRPC end to end** — live probe (`Grpc.connect`) → durable suite → method coverage + the OK/error
  histogram → input dimensions → the rich-error path → the gap worklist.
- **Coverage that drives work** — `Coverage.gaps()` is the worklist (bare arrays); the report is the
  artifact.
- **The rulebook is the oracle** — not one check pins a premium; every row asserts the live system
  against `Rule.execute`, on REST *and* gRPC. A rate change breaks nothing; a system-vs-rules drift
  breaks exactly the rows it should, naming the requirement.
- **Requirements, joined and judged** — `calc.req` links each rule arm to an acceptance criterion, so
  a run produces an RTM and a release verdict (`Requirement.readiness()` → NOT READY, blocker
  RATE-001) that a business reader can click through to the markdown.
- **A mock proven substitutable, not assumed** — one suite against the shipped mock AND a second,
  foreign implementation of the same contract, with the divergence set measured and the claim graded
  as a rung (section 3b). Two numbers, always: what agreed, and how much of the contract that covers.

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
    desk-cases.feature  desk-quote.js  cases.xlsx   # PolicyDesk: every Excel case on the screen vs the rulebook (6)
    explore-desk.md     # PolicyDesk: a plain-English goal for Harness.explore, no selectors (6)
  suites/ai/           # a coding agent's suite + its transcript, frozen (manifest.json pins it) (3c)
  fix/                 # senior-loading.patch — the rating-server fix for a driver over 70 (3c)
  legacy/              # tests in other frameworks: REST-assured, ReadyAPI, Playwright, Selenium (section 7)
  suites/migrated/     # their Karate migration by a coding agent, tagged @imported-from-<source> (section 7)
  checks/pages/        # the page checks the migrated UI features call (section 7)
  sut/                 # PolicyDesk, the underwriting UI over the Policy API (served at /desk/ by PolicyServer)
  mock/                # the in-process REST mock — and the subject of the paired run (3b)
  postman/             # the same lifecycle as a Postman collection (3d)
  lint-waivers.yaml    # the spec's accepted lint findings, each with a reason and an owner (3e)
  contract.karate.js   # the PAIRED RUN: one suite, both targets, the divergence set + the rung (3b)
  mutate.karate.js     # would your tests notice? suite mutation over suites/ai, landing on Seeded defects (8)
  contract/pairs/      # where the evidence lands when you run it — dated, append-only, committed
  config/dimensions.js # the cross / covering-array binding for POST /quotes
  karate-config.js  karate-boot.js   # config + coverage-universe wiring
  kafka/               # docker-compose + Avro schema (optional)
  rating-server/       # the standalone backend (Maven module → rating-server.jar): the gRPC rating engine
                       #   AND PolicyServer, the REST face the paired run compares the mock against
```
