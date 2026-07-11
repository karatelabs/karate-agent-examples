# azure-demo — git-first requirements traceability, one kit on two CI systems

A personal-loan decision engine demoed **git-first**: the requirements live in markdown, the business rules
are the executable oracle, and every run produces one **Requirements Traceability Matrix (RTM)** joining
*requirement → rule → run evidence*. The same kit proves two requirements-management stances by switching a
couple of environment variables — no code change:

| posture | how | what the RTM shows |
| --- | --- | --- |
| **ALM-linked (Azure DevOps)** | set `KARATE_ADO_ORG` + `KARATE_ADO_PROJECT` | each requirement id click-throughs to its **ADO User Story** |
| **pure-git / spec-driven** | leave them unset | requirements markdown **is** the source of truth; ids render as plain text, no tracker |

So one source tree runs on **Azure Pipelines** (ALM-linked) and **GitHub Actions** (pure-git) at once.

## What's inside

- **`requirements/personal-loan.md`** — the requirements (decline gate · manual-review routing · auto-approval
  · APR pricing), each with EARS acceptance criteria. These ids (`3`–`6`) are the requirement anchors.
- **`rulebooks/personal-loan/`** — the decision rules (`calc.js`) + input schema + worked scenarios. The
  rulebook is the **oracle**: it emits a requirement hit per criterion as it runs.
- **`oracle.feature`** — the **headless, CI-safe** stage: runs the rules over each scenario and asserts the
  decision + APR against an independent expectation (so a rule drift turns a row red). No browser.
- **`loan-rate-ui.feature`** + **`sut/`** — the flagship **browser** stage: drives the multi-step loan desk
  (**application → review → decision**) with `bot` (non-headless + video). Per scenario it fills the
  application, verifies the **review** screen echoes the inputs, submits, **waits** through the SUT's
  artificial "Calculating…" latency (`bot.wait`), and oracles the on-screen decision + APR against the
  rulebook. Needs a browser; runs inside the karate-agent container (which brings its own Chrome + Xvfb).
- **`openapi.yaml`** + **`mock/`** + **`checks/loan-api.feature`** — the **REST** stage: the same decision
  engine behind a `POST /decisions` API (a karate mock computes it via the same `sut/loan-calc.js` twin the
  browser runs). `cov.openapi` folds the API hits into the **same** RTM as the rules and requirements, so one
  matrix spans *requirement → rule → API → UI*. `GET /decisions/{id}` is left uncovered — the honest gap the
  RTM flags. The headless `oracle.feature` + `checks/loan-api.feature` are the CI-safe pair (no browser).

## Run it — the karate-agent container (one-shot)

The engine ships as the **`karate-agent` Docker image**; a run is one `docker run`. You supply your license
as `KARATE_LICENSE_TEXT` (sent with your evaluation).

```bash
# headless rules oracle — the CI-safe stage (no browser)
docker run --rm -v "$PWD":/work -w /work \
  -e KARATE_LICENSE_TEXT="$(cat karate.lic)" \
  public.ecr.aws/karatelabs/karate-agent:2.1.1.RC5 \
  run oracle.feature -f junit:xml,html,karate:jsonl
```

Open `target/karate-reports/index.html` — the **Traceability** tab is the RTM (requirement → rules → run).
The `-f karate:jsonl` is required: coverage + the RTM are computed from that event stream.

**Link the RTM to Azure DevOps** — add the two env vars (your org + project), and every requirement id in the
RTM becomes a link to its User Story:

```bash
docker run --rm -v "$PWD":/work -w /work \
  -e KARATE_LICENSE_TEXT="$(cat karate.lic)" \
  -e KARATE_ADO_ORG="your-org" -e KARATE_ADO_PROJECT="your-project" \
  public.ecr.aws/karatelabs/karate-agent:2.1.1.RC5 \
  run oracle.feature -f junit:xml,html,karate:jsonl
```

## In CI

The `.github/workflows/` and `azure-pipelines.yml` at the repo root run the same one-shot container: JUnit →
the native test report/Tests tab, and the report + RTM published as a build artifact. The Azure pipeline sets
the ADO coordinates (linked RTM); the GitHub Actions workflow leaves them unset (pure-git RTM) — the two
postures, side by side.

**License in CI.** Both pipelines pass your license via a `KARATE_LICENSE` secret. But it's an org-scoped
**site license**, so the simplest option is to **commit `.karate/karate.lic` into this folder** — the
container reads it straight from the mounted work dir, and CI needs **no secret at all** (drop the
`KARATE_LICENSE` variable + the `env:` mapping). Your org's call whether to check it in.

**📊 See it live:** the GitHub Actions run publishes the HTML report (RTM · coverage · run summary) to GitHub
Pages — browse the latest at **<https://karatelabs.github.io/karate-agent-examples/azure-demo/>**.

## Drive it from your own AI agent (MCP)

Serve the project and point any MCP client at it. **`serve` is the image's default** — a bare `docker run`
brings the console + MCP endpoint up on `:4444`, serving the mounted `/work` folder:

```bash
docker run --rm -p 4444:4444 -v "$PWD":/work -w /work \
  -e KARATE_LICENSE_TEXT="$(cat karate.lic)" \
  public.ecr.aws/karatelabs/karate-agent:2.1.1.RC5
```

Then `claude mcp add --transport http karate http://localhost:4444/api/mcp` (or point Cursor / VS Code at the
same URL) and ask in plain language — *"run the loan rules oracle and show me the requirement coverage gaps."*
Learn more: <https://karatelabs.io/agent>.
