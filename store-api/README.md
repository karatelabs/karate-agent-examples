# store-api — author a suite from a bare OpenAPI spec (and benchmark your agent doing it)

One `openapi.yaml` — a products / customers / orders CRUD store — and **nothing else**. No backend to
install, no tests yet: the Karate engine stands up a **stateful, schema-valid mock** straight from the
spec, and your AI agent authors the test suite against it.

Because the kit starts empty and the finish line is deterministic (every spec operation exercised, every
gap list empty — not "looks done"), it doubles as a **benchmark**: run it in your own environment, note
the wall-clock time and tool-call count, and compare against the reference envelope below. If your run is
much slower, the difference is almost always the *agent environment* (client, model, context size, other
tools loaded) — and this kit gives you a clean way to prove that and tune it.

## What's in the kit

| file | role |
| --- | --- |
| `openapi.yaml` | the whole contract — products, customers, orders (CRUD; deliberately no PUT/PATCH, so there is no *update* flow to test) |
| `karate-config.js` | binds `baseUrl` (default `http://localhost:8080` — where the engine's own mock listens) |
| `.mcp.json` | auto-connects Claude Code when this folder is opened |

You supply the engine and the license — neither ships in this repo (your `karate.lic` arrives separately).

## 1 · Run the engine

Put your license in the kit folder first:

```bash
mkdir -p .karate && cp /path/to/karate.lic .karate/karate.lic
```

**Docker** — this folder is the work folder:

```bash
docker run -d --name karate-agent -p 4444:4444 -v "$PWD":/work \
  public.ecr.aws/karatelabs/karate-agent:2.1.2.RC1
```

**Or the plain JAR** (Java 21+) — download `karate-agent-2.1.2.RC1.jar` from
<https://github.com/karatelabs/karate-addons/releases> (release tag `agent-2.1.2.RC1`), then from
this folder:

```bash
java -jar karate-agent-2.1.2.RC1.jar serve
```

Either way you get the console at **http://localhost:4444** and the MCP endpoint at
**http://localhost:4444/api/mcp**. There is no separate app to start — the agent stands up the mock
backend from the spec as its first step.

## 2 · Connect your agent

Everything surfaces through a single MCP tool, `karate_eval` (the client sends JavaScript, gets JSON
back), over **streamable HTTP** — so it works with any MCP-capable client: Claude Code, Codex, GitHub
Copilot / Copilot CLI, Cursor, VS Code, or an internal agent.

```bash
# Claude Code / Copilot CLI:
claude mcp add --transport http karate http://localhost:4444/api/mcp
```

```jsonc
// Cursor, Claude Desktop, VS Code, or any client that uses an mcpServers config:
{ "mcpServers": { "karate": { "url": "http://localhost:4444/api/mcp" } } }
```

```bash
# OpenAI Codex CLI (writes the global ~/.codex/config.toml — Codex does not read .mcp.json):
codex mcp add karate --url http://localhost:4444/api/mcp
```

(The kit's `.mcp.json` is a Claude Code convenience — it auto-connects only that client when the
folder is opened.)

> **For a fair benchmark, connect a clean client**: karate as the only (or nearly only) MCP server, a
> minimal agent config (`AGENTS.md` / `CLAUDE.md`), and a capable model. Every extra tool schema and every
> page of standing instructions is re-processed on *every* model turn — it is the single biggest lever on
> wall-clock time. Benchmark clean first; then re-run inside your everyday setup and compare.

## 3 · The benchmark prompt

Paste this to your agent, start a timer, and let it run:

```text
You are authoring end-to-end API tests with Karate over its MCP tool `karate_eval` (send
JavaScript, get JSON). Karate self-describes — never assume an API signature, ask it.

1. Call Skill.flows(), open Skill.help('scaffold-from-openapi'), and follow it: scaffold a
   runnable project from `openapi.yaml`. The scaffold stands up a stateful mock of the spec —
   there is no separate backend to start. Call <Noun>.help() before using a namespace.
2. Ground the derived requirements: rewrite each generated stub in requirements/ into real
   business intent — a clear statement, numbered acceptance criteria, a @criticality — using
   the spec for shapes but supplying the intent a spec can't (e.g. an order must reference an
   existing customer and product).
3. Author functional tests, not smoke:
   - Assert the whole response SHAPE — fuzzy markers for server-assigned fields, literals for
     business fields. A status code or a lone == '#string' is a gap, not a test.
   - Chain each resource in ONE scenario: create → capture id → read back → list → delete → 404.
   - Cover error paths per operation, asserting the error body.
   - Data-drive variations with a Scenario Outline, not copy-paste.
   - Tag every scenario @req=<id>/<criterion> against the requirements you grounded.
4. Run with coverage on. Over MCP the engine runs it for you — the default:
   Runner.suite('checks/<name>.feature') — coverage is always on, the call blocks and returns
   pass/fail (Runner.help() has the options). Only shell out if you must:
   `java -jar <the karate-agent jar> run -f karate:jsonl <feature>` (there the -f is REQUIRED).
5. Close the gaps: Coverage.gaps() lists unexercised spec operations; Requirement.gaps() lists
   uncovered criteria. Author tests and re-run until BOTH lists are empty. Retire any scaffold
   starter feature once your real tests cover the same operations.
6. Finish: Report.generate(), Requirement.matrix(), Requirement.readiness().
```

### Variant — just good tests, nothing else

Only want a strong functional test suite — no requirements, no traceability, no generated project
plumbing? Use this instead. It is written for the usual real-world case: **your own live API**, with the
spec as the operation inventory. (In this kit there is no backend, so keep step 1; against a live API,
drop step 1 and point `baseUrl` at your service.)

```text
You are authoring end-to-end API tests with Karate over its MCP tool `karate_eval` (send
JavaScript, get JSON). Karate self-describes — never assume an API signature, ask it. I want
functional tests only — do NOT create requirements, mocks beyond what step 1 needs, or any
other artifacts.

1. This project has no backend: stand up the engine's stateful mock from the spec and wire it
   so the suite starts it — Skill.help('scaffold-from-openapi') shows the two-file pattern
   (start-mock.js + karate-config.js). This is plumbing, not authoring — keep it minimal.
2. Open Skill.help('api') and follow its explore→author loop: probe the live endpoints with
   Http.* to learn the real shapes, then lock them into tests. Use
   Openapi.operations('openapi.yaml') as the inventory of what must be covered.
3. Write functional tests, not smoke:
   - Assert the whole response SHAPE — fuzzy markers for server-assigned fields, literals for
     business fields. A status code or a lone == '#string' is a gap, not a test.
   - Chain each resource in ONE scenario: create → capture id → read back → list → delete → 404.
   - Cover error paths per operation, asserting the error body.
   - Data-drive variations with a Scenario Outline, not copy-paste.
4. Run with coverage on. Over MCP the engine runs it for you — the default:
   Runner.suite('checks/<name>.feature') — coverage is always on, the call blocks and returns
   pass/fail (Runner.help() has the options). Only shell out if you must:
   `java -jar <the karate-agent jar> run -f karate:jsonl <feature>` (there the -f is REQUIRED).
5. Coverage.gaps() lists the spec operations your tests don't exercise yet — author and re-run
   until it is empty, then finish with Report.generate().
```

The finish line for this variant is simply: **suite green + `Coverage.gaps()` empty**. It skips the
requirements/readiness layer entirely — you can add that later without redoing any of the tests (tag the
scenarios and author the requirements; the coverage you built keeps counting).

A measured reference run of this variant: OpenAI Codex CLI (GPT-5.6), **3m 06s wall-clock** — suite
green, all 10 spec operations covered, `Coverage.gaps()` empty, 15 `karate_eval` calls with **zero
shell-outs** (the suite ran via `Runner.suite` over MCP) and under a second of total time inside the
engine.

### A large spec? Work in passes, not one mega-prompt

This kit's spec is 10 operations; real enterprise specs run to hundreds. Don't ask the agent to cover a
200-operation spec in one shot — it gets slower *per turn* as its context fills, and it will run out of
attention before it runs out of endpoints. The engine is built for slicing instead:

- **Orient without reading the YAML**: `Openapi.summary(…)`, `Openapi.resources(…)`,
  `Openapi.operations(…)` — the agent asks the spec instead of loading it into context.
- **One resource (or tag) per pass**: give the agent a scoped prompt — *"cover the `orders` operations"* —
  and let each pass end with a run. `Openapi.subset(…)` can even carve a self-contained slice of a huge
  spec into its own file.
- **`Coverage.gaps()` is the worklist between passes** — each pass empties part of it, and "done" is still
  deterministic across the whole spec, no matter how many sessions or even which agent did each pass.

Per-pass wall-clock stays flat this way (a fresh pass starts with a small context), which is usually
*faster* in total than one long session — and each pass is independently reviewable.

## 4 · The finish line — deterministic, not vibes

"Did it generate all the test cases?" has an exact answer here, and it is **not** a property of one
prompt-shot — it is what the gap loop is for:

- **`Coverage.gaps()` is empty** — every operation in `openapi.yaml` is exercised by a passing test.
- **`Requirement.gaps()` is empty** — every acceptance criterion is covered by a `@req=`-tagged scenario.
- The suite is green and the generated report shows the traceability matrix.

One expected nuance: `Requirement.readiness()` may still report **NOT_READY** even at full coverage. The
spec-derived mock is stateful but does not *validate* request bodies, so criteria about rejecting bad
input can't be honestly proven against it — and the engine refuses to call them proven. That is the
governance gate working, not a failure; point `baseUrl` at a real implementation of the spec and the same
suite proves them.

**Want it real?** Ask your agent to *build* a working backend from `openapi.yaml` in your own stack — and
use the suite you just authored as its acceptance gate. Point `baseUrl` at the implementation and re-run:
same tests, now proving real code. That is the same governance loop, applied to an AI-built backend.

## 5 · Score your run

Record three numbers:

| metric | where to get it |
| --- | --- |
| wall-clock time | your timer, prompt → report |
| tool calls | your client's transcript (count of `karate_eval` calls) |
| result | both gap lists empty + suite green |

**Reference envelope:** with a clean client (karate the only MCP server, minimal standing context) and a
capable model, the full arc — scaffold → ground → author → run → close gaps → report — completes in
**minutes, not tens of minutes**, at a few dozen `karate_eval` calls. A measured reference run: OpenAI
Codex CLI (GPT-5.6), this exact prompt, **7m 27s wall-clock, 45 `karate_eval` calls — of which a total of
1.3 seconds was spent inside the engine**. The other 99.7% is the model reading, reasoning, and writing —
which is why the client, the model, and the context you load are what move the number. A run several
times outside that envelope is telling you about the environment, not the task.

## If your run is slow — find where the time actually goes

The engine timestamps every MCP request. Restart with debug logging (`-e KARATE_LOG_LEVEL=DEBUG` on
Docker, `export KARATE_LOG_LEVEL=DEBUG` for the JAR) and read `target/karate-agent.log` in this folder
after a run:

- **The karate calls themselves are slow** → that's on the engine — send us the log, we want it.
- **Long gaps *between* calls** → the time is inside your agent client: model latency multiplied by
  context size. The usual fixes, in order of impact:
  1. disconnect other MCP servers for the authoring session (every tool schema rides every turn),
  2. trim standing instructions (`AGENTS.md` / `CLAUDE.md`) to what the task needs,
  3. use a stronger model — authoring quality *and* speed both track model capability,
  4. for a large real-world spec, drive it in passes (per resource/tag) and let the gap loop steer,
     instead of one mega-prompt.

Then re-run the benchmark and watch the delta.
