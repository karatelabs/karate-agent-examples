# MCP field study — eight public servers, measured

Eight public MCP servers were driven through Karate's dual-era MCP client and their answers saved
verbatim: the protocol revision each one negotiated, its full `tools/list` catalog, and two
deliberate bad calls each — an unknown tool name, and a real tool called with its required arguments
omitted. **No valid tool invocation was made**, so a metered server was never billed for work.

Everything in this folder is the servers' own output, unedited, plus one generated table.

```
METRICS.md              the catalog metrics table — generated from the captures below
roster.json             the eight servers, their endpoints and how auth was handled
<server>/server.json    what initialize returned: the negotiated revision, capabilities, instructions
<server>/catalog.json   the verbatim tools/list result
<server>/bad-calls.json the two deliberate failures and exactly what came back
```

The example kit next door ([`../README.md`](../README.md)) shows how these calls are written as
ordinary Karate checks.

## Findings

**1. The era split is bimodal, and nothing negotiates up.** Four of the eight negotiated the current
revision `2026-07-28` (apify, cloudflare-docs, context7, docling), and every one of those four also
connected on a pinned `2025-11-25` — genuinely dual-era, not merely modern. The other four are
legacy-only: `2025-11-25` (deepwiki, exa) and `2025-06-18` (llamacloud, microsoft-learn).
Auto-negotiation proposes the modern revision first, so a legacy row is where that server's own
fallback resolved. Zero configuration beyond a URL — plus one bearer token — connected all eight.
Two assign a session id (exa, microsoft-learn; the values are redacted in the captures).

*Caveat:* a legacy server is not re-probed for the other legacy revision, so its `eras` list is one
entry by construction. Only the modern lane is probed both ways
(`<server>/server.json` → `eras`, `negotiated.lane`).

**2. The error envelope is bimodal — and it splits inside a single server.** An unknown tool name
draws a JSON-RPC `-32602` from five of eight (apify, cloudflare-docs, context7, llamacloud,
microsoft-learn) and an ordinary result with `isError` set from three (deepwiki, docling, exa). A
missing required argument draws `isError` from six and `-32602` from two (apify, llamacloud).
**Three of eight answer the two failure classes in two different shapes** — cloudflare-docs,
context7 and microsoft-learn each return `-32602` for the unknown tool and an `isError` result for
the missing argument.

Actionability does not track the shape either. microsoft-learn's missing-argument body is the whole
of `"An error occurred invoking 'microsoft_code_sample_search'."` — it names no parameter — while
apify's unknown-tool error enumerates all twelve available tools and tells the caller to re-read
`tools/list`. **The consequence:** whether an error envelope makes an agent's next action decidable
has to be graded per failure class, not per server (`<server>/bad-calls.json`).

**3. Token footprint is the outlier axis, and it is orthogonal to tool count.** apify carries 12
tools in 73,475 characters (~18,368 tokens) — about **fifteen times the roster median of 4,858** —
and that is before its `instructions` block of 4,760 characters, which the catalog table does not
count. The smallest catalogs are 1,516 (deepwiki), 1,793 (cloudflare-docs) and 2,142 (exa). Size
does not follow count: llamacloud is 25 tools in 26,626 characters and docling 19 in 20,844, so
apify carries half llamacloud's tools in nearly three times its characters.

`instructions` is unmetered context of exactly the same kind — it is injected like the catalog but
sits outside every catalog metric. Five of eight servers send one, 10,184 characters in total, and
deepwiki's 2,748-character block is **1.8× its own catalog** while enumerating 21 tools, 18 of which
its three-tool catalog does not contain (`<server>/server.json` → `negotiated.instructions`).

**4. Vacuity barely fires; length and per-parameter coverage discriminate.** Across eight catalogs
there is **one** vacuous parameter description in **183 parameters**, and **zero** vacuous tool
descriptions in **68 tools**. The single hit is cloudflare-docs' `query`, which carries no
description at all — the dual-era control has the roster's weakest parameter documentation (0 of its
1 parameter described; every other server describes 100%). Meanwhile median description length spans
**fifteen-fold**, from 59 characters (deepwiki) to 894 (microsoft-learn). So the vacuity check is a
floor, not a grade: on real catalogs the deterministic axes that actually discriminate are
description length and per-parameter description coverage.

**5. Parameter-name overload exists in the wild — three of eight servers.** The same parameter name
carries divergent types across tools: `limit` and `offset` on apify, `limit` on llamacloud,
`repoName` on deepwiki. An agent picking arguments by name has to re-learn the type per tool.

**6. Optional fraction ranges 0%–68%, and the two large catalogs sit at opposite ends.** Zero
percent on cloudflare-docs, context7 and deepwiki; 68% on apify; llamacloud 67% against docling 14%
at comparable size. It is shape, not size.

**7. Nobody paginates.** `nextCursor` is absent from all eight `tools/list` results. The capture
harness follows cursors and never had one to follow.

**8. "No auth" from a probe can hide a metered path.** apify connected only with a bearer token
(`authMode: "bearer"`) even though its discovery hop answers before auth. exa connected anonymously
(`authMode: "anonymous"`), so its metered call path was never exercised here. A directory's or a
probe's "no auth" classification is therefore a statement about the discovery hop, not about the
call path a real workload uses.

## Two graded pairs

**Context7 vs DeepWiki — same job, same scale.** Context7 spends 4,870 characters on 2 tools where
DeepWiki spends 1,516 on 3: **3.2× the characters for a comparable catalog**, and a 429-character
median description against DeepWiki's 59. Both describe 100% of their 4 parameters and both sit at
0% optional, so the divergence is entirely prose depth and schema shape — Context7's parameters are
flat (depth 1), DeepWiki's reach depth 2 and its `repoName` carries two types across tools. Their
error envelopes diverge too: Context7 splits (`-32602` for an unknown tool, `isError` for a bad
argument), DeepWiki answers both with `isError` — and its bad-argument body is a raw pydantic dump,
`"2 validation errors for call[ask_question]"` plus a link to `errors.pydantic.dev`.

What each choice costs an agent: Context7 buys per-call context (~1.2k tokens injected before any
work) and pays for it with descriptions that say *when* to reach for the tool; DeepWiki is cheap to
load and makes the model infer the contract, then hands back a framework stack trace to recover
from — and its uniform `isError` means a client that only catches JSON-RPC faults sees a success.

**LlamaCloud vs Docling — the hosting-model pair.** LlamaCloud: 25 tools, 91 parameters, 67%
optional, legacy-only `2025-06-18`, hosted, JSON-RPC `-32602` on both bad calls. Docling: 19 tools,
35 parameters, 14% optional, dual-era with a modern default, run locally from a container, `isError`
on both. Same order of magnitude in characters (26,626 vs 20,844) and the same maximum nesting depth
(3), so the catalogs cost an agent about the same to read. What differs is what the agent must
decide: LlamaCloud's 91 parameters at 67% optional means most calls are underdetermined — the model
chooses which optionals to send, and a wrong choice is silent — while Docling's 35 parameters at 14%
optional means the shape is mostly forced: fewer decisions, less reach. On the failure side
LlamaCloud's uniform `-32602` is decidable by protocol alone, while Docling's uniform `isError`
requires reading text. Neither is better; each moves the cost somewhere else.

## Metric definitions

These are the rules behind every column in [`METRICS.md`](METRICS.md).

- **chars** — the strict-JSON length of the `tools` array alone; the modern envelope's `ttlMs`,
  `cacheScope` and `_meta` are excluded, so the number is era-neutral.
- **~tokens** — `chars / 4`, an approximation. Catalog JSON is code-dense, so it **undercounts**.
- **params (sum/max)** — the count of `inputSchema.properties` keys, summed and maxed over tools.
- **optional %** — `(params − required) / params` over **all** parameters, not averaged per tool.
  `required` is `inputSchema.required` intersected with `properties`, so a listed-but-undeclared name
  is ignored.
- **depth max** — a scalar is 1; an `object` adds 1 per level; an `array` adds 1 and descends into
  `items`; `anyOf` / `oneOf` / `allOf` descend without adding a level; a tool with no properties is
  0. So an array of scalars is depth 2.
- **desc chars (median)** — the median tool `description` length, taking **the lower of the two
  middle values** on an even count.
- **params described %** — parameters carrying a non-empty `description`, over all parameters.
- **vacuous** — a description is vacuous when it is absent, or when lowercasing it, splitting on
  non-letters and subtracting a stopword list and the parameter's own name tokens leaves nothing.
  The name is split on `_`, `-`, `.`, camelCase and acronym boundaries.
- **name collisions** — exact-duplicate tool names, plus names that collide once lowercased with `_`
  and `-` stripped (an agent picking by name cannot tell those apart).
- **param overload** — a parameter name appearing on two or more tools under two or more different
  `type`s.

**Disclosed approximations:** sizes are characters; tokens are chars/4 and undercount; the median is
the lower middle; `$ref` resolves **only** against the tool schema's own `$defs` / `definitions`, and
an unresolvable ref counts as depth 1 and is tallied separately.

## Roster and attribution

Each server is named as its vendor's public endpoint, and every capture is that server's own output,
saved unedited. Auth is listed by **environment-variable name only** — no credential value appears
anywhere in this repository, and session ids are redacted.

| server | endpoint | auth | classification |
|---|---|---|---|
| cloudflare-docs | `https://docs.mcp.cloudflare.com/mcp` | none | dual-era control |
| microsoft-learn | `https://learn.microsoft.com/api/mcp` | none | legacy only; answers over SSE |
| context7 | `https://mcp.context7.com/mcp` | none | dual-era |
| deepwiki | `https://mcp.deepwiki.com/mcp` | none | legacy |
| apify | `https://mcp.apify.com` | `APIFY_TOKEN` | discovery answers pre-auth; `initialize` needs the token |
| exa | `https://mcp.exa.ai/mcp` | `EXA_API_KEY` | legacy; auth mode discovered by retry (answered anonymously) |
| llamacloud | `https://mcp.llamaindex.ai/mcp` | none | legacy `2025-06-18` |
| docling | `http://localhost:8765/mcp` | none | local container |

Nothing here is a claim about any vendor's quality. Every server named above is named as the carrier
of a measurement, and the measurements were taken at one point in time — a catalog can change the
day after it is captured, which is the whole argument for treating one as a contract you test.

## Reproducing this

The capture harness is part of the Karate engine's own test suite; it is not shipped as a command
you run from this folder. What is here is the committed, verbatim output of that harness, so the
numbers in [`METRICS.md`](METRICS.md) are recomputable from these files alone and every finding above
can be checked against the JSON it cites.

Two things about how the captures were taken are worth stating, because they bound what the data can
support:

- **The spend guard.** The harness makes no valid tool invocation — only `tools/list` and the two
  bad calls — so a metered server is never billed for work, and no server's actual results are
  represented here.
- **Servers are sealed off from each other.** A failure against one server writes an `error.json` in
  that server's folder and the rest of the roster still runs, so a partial roster is visible rather
  than silent.

To point the same style of check at your own server, start from the example kit's README
([`../README.md`](../README.md)) — the catalog you save there becomes your coverage universe the same
way `catalog.json` is the measured universe here.
