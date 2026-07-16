# karate-agent-examples

Evaluation kits for **karate-agent** — the governance layer for AI-built software: requirements, coverage,
rules, and evidence as one git-native graph an LLM drives and a human audits. One engine, many surfaces
(a JS API + curl + MCP + a served console).

> We sent the **product sheet**, the **QUICKSTART**, and your **`karate.lic`** separately. Each kit's
> `README.md` says how to run it — either drop the engine jar (`karate-async-<version>.jar`) into the kit, or
> run the one-shot **`karate-agent` container** (no jar to stage). Your `karate.lic` governs the engine.
> Learn more: <https://karatelabs.io/agent>

## Kits

| kit | what it demonstrates |
| --- | --- |
| [`policy-api`](policy-api/) | one insurance API across three protocols — REST (OpenAPI) + gRPC + Kafka — in a single Coverage report: live probe → durable suite → method coverage → input dimensions → the rich-error path → the gap worklist. |
| [`azure-demo`](azure-demo/) | git-first **requirements traceability** for a loan-decision engine — requirements → rules → run evidence in one RTM. The *same* kit runs ALM-linked on **Azure Pipelines** (requirement ids click through to Azure DevOps User Stories) and pure-git / spec-driven on **GitHub Actions**, switched by two env vars. |
| [`store-api`](store-api/) | **start-from-scratch benchmark** — a bare OpenAPI spec and nothing else: the engine stands up a stateful mock from the spec, your AI agent authors the suite, and the gap lists define "done" deterministically. Includes a cheat-sheet for timing your own agent environment against a clean reference. |

## License

The example code in this repository is provided under the [MIT License](LICENSE). It is **not** the
karate-agent license — your `karate.lic` is sent separately and governs the engine.
