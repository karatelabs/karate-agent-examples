# karate-agent-examples — requirements traceability, test coverage & governance for AI-built software

Runnable evaluation kits for **[Karate Agent](https://karatelabs.io/agent)** — the governance layer for
AI-generated code. Requirements, tests, business rules, coverage and evidence become **one git-native
traceability graph** an LLM drives and a human audits: requirements as code in markdown, a
**Requirements Traceability Matrix (RTM)** generated from real run evidence, and API + UI test coverage in
the same report. One engine, many surfaces — a JavaScript API, `curl`, **MCP** (so any AI agent can drive
it), and a served console.

**Why it exists.** AI now writes more code than any team can hand-review. These kits show the deterministic
answer: every requirement carries EARS acceptance criteria, every test attests to a criterion, and the
report says — from evidence, not from an AI's opinion — what is covered, what is failing, what was never
verified, and whether it is safe to ship.

> Each kit's `README.md` says how to run it — either drop the engine jar (`karate-async-<version>.jar`) into
> the kit, or run the one-shot **`karate-agent` container** (no jar to stage). We sent the **product sheet**,
> the **QUICKSTART** and your **`karate.lic`** separately; the license governs the engine.

## See the deliverable before installing anything

The `traceability-demo` kit publishes its **real CI output** to GitHub Pages on every run — the actual
report, in a browser, nothing installed and no license needed:

**<https://karatelabs.github.io/karate-agent-examples/traceability-demo/>**

- Coverage report — `.../traceability-demo/ext/coverage/pages/coverage.html`
- Traceability matrix (RTM) — `.../traceability-demo/ext/traceability/pages/traceability.html`

## Kits

| kit | what it demonstrates |
| --- | --- |
| [`traceability-demo`](traceability-demo/) | git-first **requirements traceability** for a loan-decision engine — requirements → business rules → run evidence in one RTM. The *same* kit runs ALM-linked on **Azure Pipelines** (each requirement id click-throughs to its Azure DevOps User Story) and pure-git / **spec-driven** on **GitHub Actions**, switched by two environment variables. |
| [`policy-api`](policy-api/) | one insurance API across three protocols — REST (OpenAPI) + gRPC + Kafka — in a single coverage report: live probe → durable suite → method coverage → input dimensions → the rich-error path → the gap worklist. |
| [`kiro-demo`](kiro-demo/) | **"done" is a claim, not evidence** — the requirements are read straight out of an AI coding tool's own spec folder, with its task list ticked complete. Every scenario passes and the verdict is still **NOT READY**: one criterion a completed task claims is implemented but never exercised. Rules + REST only, no browser, about half a second per run. |
| [`store-api`](store-api/) | **start-from-scratch benchmark** — a bare OpenAPI spec and nothing else: the engine stands up a stateful mock from the spec, your AI agent authors the suite, and the gap lists define "done" deterministically. Includes a cheat-sheet for timing your own agent environment against a clean reference. |

### Protocol examples

Plain, self-contained examples of testing a non-HTTP protocol — no traceability or coverage story, just
the protocol. Each ships the service under test, so it runs standalone, and each is driven by the
`karate-async` engine jar rather than the container image.

| kit | what it demonstrates |
| --- | --- |
| [`grpc`](grpc/) | unary, server-streaming, client-streaming and bidirectional calls, request/response metadata, and asserting a gRPC error status. **No generated stubs on the test side** — the `.proto` is read at run time, so there is nothing to regenerate when the contract changes. |
| [`kafka`](kafka/) | produce and consume, as JSON and as Avro through a Schema Registry, with message headers and a filtering consumer. Broker and registry come up with `docker compose`. |
| [`websocket`](websocket/) | raw text, JSON, and collecting a stream of messages — plus a **custom frame-based protocol** (STOMP) handled by a codec, so protocol handling stays out of the checks. Both demo servers compile against the engine jar alone: no build tool. |

## Drive it from your own AI agent (MCP)

Every kit is drivable over the **Model Context Protocol**. Serve the project and point any MCP client
(Claude Code, Cursor, VS Code, or your own agent) at it, then ask in plain language — *"run the loan rules
oracle and show me the requirement coverage gaps."* Each kit README carries the exact command.

## Learn more

- **Karate Agent** — the AI-driven agent, served console and traceability engine: <https://karatelabs.io/agent>
- **Karate Enterprise** — the commercial platform, licensing and support: <https://karatelabs.io/karate-enterprise>

## License

The example code in this repository is provided under the [MIT License](LICENSE). It is **not** the
karate-agent license — your `karate.lic` is sent separately and governs the engine.
