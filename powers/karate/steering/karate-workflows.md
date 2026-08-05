# Karate workflows

Karate ships its own instructions and serves them on demand. Do not improvise a multi-step task from first principles — **pull the workflow that matches and follow it**. Each is a complete recipe, kept in step with the running engine.

```js
Skill.flows()                       // the task-framed menu
Skill.help('<name>')                // one workflow, end to end
Skill.help('<name>', '<topic>')     // a deep dive within it
Skill.search('coverage gaps')       // when you do not know the name
```

`Skill.list()` on the live server is authoritative — a workflow gated on an add-on appears only when that add-on is installed. The tables below are what the current release carries.

## By task

| The user wants to | Pull |
|---|---|
| Start a new Karate project — first test → green run → CI | `Skill.help('getting-started')` |
| Run Karate without Java build tooling — CLI-first | `Skill.help('cli')` |
| Run a whole demo/suite in one command — serve the app + UI + API + rules → one report (CI/DevOps) | `Skill.help('launch')` |
| Author & improve API tests — explore a live API, lock the contract shape, oracle the business values against the rules | `Skill.help('api')` |
| Stand up a mock server from a feature file — author one, and serve one you already have | `Skill.help('mock')` |
| Migrate existing tests into idiomatic Karate | `Skill.help('migration')` |
| Measure coverage and find the gaps | `Skill.help('coverage')` |
| Forward-engineer a rulebook from a business requirement | `Skill.help('rule-authoring')` |
| Author & govern requirements — traceability, readiness, review | `Skill.help('requirements')` |
| Review a feature file against the quality checklist | `Skill.help('review')` |
| Turn a recorded UI flow into a maintainable check | `Skill.help('record-to-check')` |
| Govern an API spec — lint it against a style guide, grade it, enforce your own rules, and prove the mock can stand in for the provider (contract testing — the paired run) | `Skill.help('api-governance')` |
| Scaffold a whole tested project from an OpenAPI spec | `Skill.help('scaffold-from-openapi')` |
| Scaffold a runnable Kafka project from an AsyncAPI doc | `Skill.help('scaffold-from-asyncapi')` |

## Reference

Not a task — look these up while doing one.

| Workflow | Covers |
|---|---|
| `Skill.help('assertions')` | match equals/contains/each + the matcher cheat-sheet; fuzzy markers. |
| `Skill.help('grpc')` | karate.channel('grpc') + the live Grpc.* namespace; reuses REST scenario ergonomics. |
| `Skill.help('kafka')` | karate.channel('kafka') + the live Kafka.* namespace; produce/consume; JSON/Avro/Protobuf serialization. (karate-kafka addon.) |
| `Skill.help('websocket')` | karate.channel('websocket') over core's WsClient — send/collect frames, the WireCodec serde seam (raw/JSON/custom, e.g. STOMP) + the WebsocketLifecycle handshake mix-in, subprotocol + TLS. |
| `Skill.help('markup')` | The design-language-of-record for Karate HTML apps: the karate-core template engine + Tailwind/Alpine/HTMX. Server returns HTML, no build step. |

## Deep dives

Some workflows carry topic files — pass the topic as the second argument.

- `api` → `auth`, `hooks-config`, `data-driven`, `error-paths`, `reuse-call`
- `assertions` → `match`, `fuzzy`, `schema-tools`
- `coverage` → `suite-structure`, `dimensions`
- `requirements` → `authoring`, `semantic-review`
- `review` → `feature-file-review`, `assertion-strength`
- `markup` → `app-setup`, `tailwind`, `catalog`, `alpine`, `components`, `forms`, `sse`
- `api-governance` → `lint-rule-authoring`
- `scaffold-from-openapi` → `reverse-engineer-requirements`
