# karate-agent-examples

Evaluation kits for **karate-agent** — the governance layer for AI-built software: requirements, coverage,
rules, and evidence as one git-native graph an LLM drives and a human audits. One engine, many surfaces
(a JS API + curl + MCP + a served console).

> We sent the **product sheet**, the **QUICKSTART**, and your **`karate.lic`** separately. Drop the engine
> jar (`karate-async-<version>.jar`) and `karate.lic` into a kit and follow its `README.md`.
> Learn more: <https://karatelabs.io/agent>

## Kits

| kit | what it demonstrates |
| --- | --- |
| [`policy-api`](policy-api/) | one insurance API across three protocols — REST (OpenAPI) + gRPC + Kafka — in a single Coverage report: live probe → durable suite → method coverage → input dimensions → the rich-error path → the gap worklist. |

## License

The example code in this repository is provided under the [MIT License](LICENSE). It is **not** the
karate-agent license — your `karate.lic` is sent separately and governs the engine.
