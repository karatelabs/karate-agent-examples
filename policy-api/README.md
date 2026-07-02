# policy-api — one insurance API across three protocols (REST · gRPC · Kafka)

A single insurance project that exercises **REST (OpenAPI)**, **gRPC**, and **Kafka** together, so one
Coverage report spans all three sources (`cov.openapi` · `cov.grpc` · `cov.kafka`).

- **gRPC is the primary, always-on backend** — a small `RatingService` (the premium engine) on `:50052`,
  no Docker. All four RPC kinds, descriptor-grade input dimensions, and the rich-error path.
- **REST (OpenAPI)** — a Policy API (quotes · policies · claims) backed by an in-process mock.
- **Kafka is the optional fourth beat** — a `policy-events` stream (Avro). It needs Docker, so it is **off
  by default**; turn it on with the `kafka/` compose file + the `cov.kafka` block in `karate-boot.js` (see section 4).

The domain ties them together: a **quote** (REST) is priced by the **rating engine** (gRPC); a bound
**policy** emits a **policy-event** (Kafka).

## What you need

Two files, sent with your license, dropped into this folder:

| file | what it is |
| --- | --- |
| `karate-async-2.1.1.RC4.jar` | the engine |
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
java -jar karate-async-2.1.1.RC4.jar serve . --port 4444
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
> `Report.generate()` under the report dir (e.g. `target/karate-reports/coverage-report.html`).
> Open the report **in place** — the HTML loads sibling `res/` + data files, so don't copy the `.html`
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

## 4. Kafka — the optional event side

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

## Files

```
policy-api/
  README.md            # this file
  openapi.yaml         # the REST Policy API contract (coverage universe)
  proto/rating.proto   # the gRPC rating contract (coverage universe, with field bounds)
  checks/              # the .feature suites (rating.feature, policy.feature)
  mock/                # the in-process REST mock
  karate-config.js  karate-boot.js   # config + coverage-universe wiring
  kafka/               # docker-compose + Avro schema (optional)
  rating-server/       # the standalone gRPC backend (Maven module → rating-server.jar)
```
