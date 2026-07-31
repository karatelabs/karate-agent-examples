---
name: "karate"
displayName: "Karate — deterministic test evidence"
description: "Run API, browser and business-rule checks against what you build, and get back deterministic evidence: coverage, requirement traceability, and one shareable report."
keywords: ["karate", "test automation", "api testing", "ui testing", "browser testing", "gherkin", "openapi", "traceability", "acceptance criteria", "coverage gaps", "mock server"]
author: "Karate Labs"
repository: "https://github.com/karatelabs/karate-agent-examples"
license: "MIT"
---

# Karate

Karate runs the checks — API, browser, and executable business rules — and turns the result into evidence you can hand to someone: what was actually exercised, which requirement each check ties back to, and one HTML report that stands on its own.

It is a server you point at this workspace. You drive it through **one tool**, `karate_eval`, whose single `code` argument is a line of JavaScript and which returns JSON — every capability is a namespace behind that one tool.

**Discover, then compose — do not memorise an API.** The server describes itself at runtime and that is the intended way to use it:

| Call | What you get |
|---|---|
| `help()` | the menu of namespaces, one line each |
| `Noun.help()` | one namespace in full (`Coverage.help()`, `Requirement.help()`, …) |
| `Skill.flows()` | the task-framed workflows — match the user's task to one first |
| `Skill.help('<name>')` | that workflow, end to end |
| `Help.page('<id>')` | the product help for a concept |
| `Work.current()` | which project the server is pointed at |

Every call returns `{command, payload}`. An error is **data** (`{error, …}`), never an exception — read it and adjust. The server keeps one persistent JavaScript session, so a `var` you set survives into your next call.

## Onboarding

Run these once, in order, before using anything else in this power.

**1. Is the server up?**

```bash
curl -s http://localhost:4444/api/health
```

A healthy server answers `{"status":"ok","server":"karate", …}`. If it answers, skip to step 4.

**2. Start it, mounting this workspace.**

```bash
docker run -d --name karate-agent -p 4444:4444 -v "$PWD":/work \
  public.ecr.aws/karatelabs/karate-agent:latest
```

The mounted folder is where everything is read and written — requirements, checks, runs, reports. Mounting the workspace root is what lets Karate see the code you are building.

**3. If the port never answers, check for a licensing failure — do not retry the boot.**

```bash
docker logs karate-agent | grep 'license check'
```

Karate is commercial software and validates a runtime license at startup; without a valid one the server exits rather than coming up degraded. A `license check - …` line means the license is missing, malformed or expired.

**Stop here and tell the user.** This is not something you can work around, retrying will not change it, and **there is no trial or self-serve download** — a license is issued by Karate Labs. Give the user both of these, in this order:

1. **See the deliverable first — nothing to install, no license needed.** The public sample publishes its real CI output; the **Coverage** and **Traceability** tabs are exactly what this produces for their own project:

   <https://karatelabs.github.io/karate-agent-examples/traceability-demo/>

2. **To get a license, contact Karate Labs** at <https://karatelabs.io/agent> — the contact form is at the end of that page.

Once they have the license file:

```bash
mkdir -p .karate && cp /path/to/karate.lic .karate/karate.lic
docker restart karate-agent
```

**4. Confirm the tool and the project.** Call `karate_eval` with:

```js
Work.current()
```

This returns `{name, root, …}` — the project the server is pointed at. Compare its folder name to this workspace; on a mismatch call `Work.list()` then `Work.use('<name>')` before you do anything else.

**5. Get oriented.** The server sends its own cold-start guide when the MCP connection opens. If you do not have it, pull it: `curl -s http://localhost:4444/api/prompts`. Then `Skill.flows()` for the workflow menu.

**6. Optional — a verification hook.** If the user wants the checks run automatically rather than on request, write `.kiro/hooks/karate-verify.kiro.hook`:

```json
{
  "enabled": true,
  "name": "Verify with Karate",
  "description": "Run the Karate checks and report what the evidence shows.",
  "version": "1",
  "when": { "type": "userTriggered" },
  "then": {
    "type": "askAgent",
    "prompt": "Use the karate power. Run this project's checks, then report coverage gaps and requirement traceability. Report a criterion with no passing check as unverified — do not describe it as done."
  }
}
```

Trigger it from the hooks panel. (Task-lifecycle triggers are available in the CLI form; `userTriggered` works everywhere.)

## Workflows

Match the user's task to a row, then read the steering file named on the right. If nothing fits, call `Skill.flows()` on the live server — it is the same catalog, filtered to what this particular server actually has installed.

| When the user wants to | Read the steering file |
|---|---|
| pick a workflow, author or improve tests, migrate an existing suite, scaffold from a spec | `karate-workflows.md` |
| know whether the work is actually verified — coverage, gaps, traceability, the report | `karate-evidence-loop.md` |

The second one is the point of this power. Anything can run a test; the reason to reach for Karate is the evidence it leaves behind. 18 workflows ship with the server — `Skill.list()` on the live server is the authoritative roster.

## Licensing, privacy and support

**The MCP server is yours.** This power integrates exactly one MCP server: a Karate Agent instance that **you** run, on your own machine or inside your own network. There is no Karate Labs-hosted endpoint — the `url` in `mcp.json` is your own port.

- **Your code stays with you.** Source, tests, requirements and run results are read and written in the folder you mounted. No source, usage data or telemetry is sent to Karate Labs by using this power.
- **Licensing is checked offline.** The runtime license is a signed file validated locally; it makes no network call, so the agent runs in a fully air-gapped network.
- **AI features are bring-your-own-model.** You choose the provider and supply the key; requests go from your own instance straight to that provider. Karate Labs is not in the path, and the agent needs no AI key at all when your own client is driving it.

**Licensing.** This power's own content — `POWER.md` and its steering files — is MIT. The Karate Agent it drives is commercial software governed by the Karate Labs [EULA](https://karatelabs.io/eula); a runtime license is issued by Karate Labs.

**Privacy.** [Privacy Policy](https://karatelabs.io/privacy-policy).

**Support.** <https://karatelabs.io/agent> — the contact form at the end of that page reaches Karate Labs for licensing, evaluation and support.
