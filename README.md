# karate-agent-examples — requirements traceability, test coverage & governance for AI-built software

Runnable evaluation kits for **[Karate Agent](https://karatelabs.io/agent)** — the governance layer for
AI-generated code. It joins requirements, tests, business rules, coverage and evidence into **one
traceability graph in git**. An LLM drives it; a human audits it. Requirements live as code in markdown.
A **Requirements Traceability Matrix (RTM)** is built from real run evidence. API and UI test coverage
land in the same report. One engine, many surfaces: a JavaScript API, `curl`, **MCP** (so any AI agent
can drive it), and a served console.

**Why it exists.** AI now writes more code than any team can review by hand. These kits show the
deterministic answer. Every requirement carries EARS acceptance criteria, and every test attests to a
criterion. The report then says — from evidence, not from an AI's opinion — what is covered, what is
failing, what was never verified, and whether it is safe to ship.

> Each kit's `README.md` says how to run it. Either drop the engine jar (`karate-async-<version>.jar`)
> into the kit, or run the one-shot **`karate-agent` container** (no jar to stage). We sent the
> **product sheet**, the **QUICKSTART** and your **`karate.lic`** separately; the license governs the
> engine.

## See the deliverable before installing anything

The `traceability-demo` kit publishes its **real CI output** to GitHub Pages on every run. You see
the actual report in a browser, with nothing to install and no license needed:

**<https://karatelabs.github.io/karate-agent-examples/traceability-demo/>**

- Coverage report — `.../traceability-demo/ext/coverage/pages/coverage.html`
- Traceability matrix (RTM) — `.../traceability-demo/ext/traceability/pages/traceability.html`

## Kits

| kit | what it demonstrates |
| --- | --- |
| [`traceability-demo`](traceability-demo/) | git-first **requirements traceability** for a loan-decision engine: requirements → business rules → run evidence in one RTM. The same kit runs two ways — ALM-linked on **Azure Pipelines** (each requirement id links to its Azure DevOps User Story) and pure-git / **spec-driven** on **GitHub Actions**. Two environment variables switch the mode. |
| [`policy-api`](policy-api/) | one insurance API across three protocols — REST (OpenAPI) + gRPC + Kafka — in a single coverage report: live probe, durable suite, method coverage, input dimensions, the rich-error path, and the gap worklist. |
| [`kiro-demo`](kiro-demo/) | **"done" is a claim, not evidence.** The requirements come straight from an AI coding tool's own spec folder, with its task list ticked complete. Every scenario passes, yet the verdict is **NOT READY**: one criterion a completed task claims is implemented, but no test exercises it. Rules + REST only, no browser, about half a second per run. |
| [`store-api`](store-api/) | **start-from-scratch benchmark.** A bare OpenAPI spec and nothing else. The engine stands up a stateful mock from the spec, your AI agent authors the suite, and the gap lists define "done" deterministically. Includes a cheat-sheet for timing your own agent environment against a clean reference. |
| [`fleetquote`](fleetquote/) | **the rulebook and its twin, end to end.** A fleet-auto rating engine as one executable rulebook — readable spec, oracle with a plain-English audit trail, the mock's brain, and the model every view derives from — plus a lifecycle twin walked to "the defect only order finds". Start with [`TUTORIAL.md`](fleetquote/TUTORIAL.md); [`demo/`](fleetquote/demo/) holds a worked twin and the pinned sequence that catches the defect. |
| [`checkout`](checkout/) | **consumer-side contract testing.** A checkout service depends on a payments API another team owns. The kit holds the mock the team builds against, an independently implemented real provider, and the **paired run** that proves the mock can stand in — including one deliberate divergence the suite's assertions cannot see, which the pair reports anyway. Consumer-driven contracts with a readable functional suite instead of pact files, and git instead of a broker. |

### Protocol examples

Plain, self-contained examples of testing a non-HTTP protocol. No traceability or coverage story — just
the protocol. Each kit ships the service under test, so it runs standalone, and each runs off the
`karate-async` engine jar rather than the container image. All three run on every push and publish
their reports: [grpc](https://karatelabs.github.io/karate-agent-examples/grpc/) ·
[kafka](https://karatelabs.github.io/karate-agent-examples/kafka/) ·
[websocket](https://karatelabs.github.io/karate-agent-examples/websocket/).

| kit | what it demonstrates |
| --- | --- |
| [`grpc`](grpc/) | unary, server-streaming, client-streaming and bidirectional calls, request/response metadata, and asserting a gRPC error status. **No generated stubs on the test side** — the engine reads the `.proto` at run time, so there is nothing to regenerate when the contract changes. |
| [`kafka`](kafka/) | produce and consume, as JSON and as Avro through a Schema Registry, with message headers and a filtering consumer. `docker compose` starts the broker and the registry. |
| [`websocket`](websocket/) | raw text, JSON, and collecting a stream of messages — plus a **custom frame-based protocol** (STOMP) handled by a codec, so protocol handling stays out of the checks. Both demo servers compile against the engine jar alone: no build tool. |

## Drive it from your own AI agent (MCP)

Every kit can be driven over the **Model Context Protocol**. Serve the project, point any MCP client
(Claude Code, Cursor, VS Code, or your own agent) at it, and ask in plain language — *"run the loan
rules oracle and show me the requirement coverage gaps."* Each kit README carries the exact command.

## Learn more

- **Karate Agent** — the AI-driven agent, served console and traceability engine: <https://karatelabs.io/agent>
- **Karate Enterprise** — the commercial platform, licensing and support: <https://karatelabs.io/karate-enterprise>

## License

The example code in this repository is provided under the [MIT License](LICENSE). It is **not** the
karate-agent license — your `karate.lic` is sent separately and governs the engine.
