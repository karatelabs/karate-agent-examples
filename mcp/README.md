# MCP

Testing an MCP server with Karate — discover the tool catalog, call tools, assert the results and the
side effects they leave behind, and measure **tool coverage**. The client negotiates the protocol era
for you, so the same checks run against a current server and against the handshake-era servers that
make up most of the installed base. **No SDK on the test side:** your checks stay plain text.

```
checks/inventory.feature   the checks
checks/mcp-tools.json      a saved tools/list result — the coverage universe
karate-boot.js             the endpoint and the coverage universe, set once
server/                    the demo MCP server under test (stands in for your server)
```

## What you need

1. **The engine** — `karate-async-2.1.3.RC3.jar` from the
   [releases](https://github.com/karatelabs/karate-addons/releases). Put it beside this folder, or
   anywhere you like and adjust the paths below. The container image works too — see below.
2. **A license** — a `karate.lic` file at `.karate/karate.lic` in this folder, or the same text in the
   `KARATE_LICENSE_TEXT` environment variable. MCP is part of the `openapi` entitlement.
3. **JDK 21+** and **Node 20+**, to build and run the demo server.

## Run it

Start the demo server (one terminal):

```bash
cd server && npm ci && npm start
```

It listens on `http://localhost:3001/mcp`. Run the checks (another terminal):

```bash
java -jar ../karate-async-2.1.3.RC3.jar run -f html,junit:xml checks
```

You should see six scenarios pass. The HTML report is written to `target/karate-reports/`.

MCP needs no protocol libraries, so the **container image** carries the client as well — the same run
without staging a jar:

```bash
docker run --rm -v "$PWD":/work -w /work \
  --add-host=host.docker.internal:host-gateway \
  -e KARATE_LICENSE_TEXT="$(cat karate.lic)" \
  -e MCP_URL="http://host.docker.internal:3001/mcp" \
  public.ecr.aws/karatelabs/karate-agent:2.1.3.RC3 \
  run -f html,junit:xml checks
```

The server runs on your machine, so the container reaches it through `host.docker.internal` and
`MCP_URL` overrides the endpoint `karate-boot.js` defaults to. On Docker Desktop that host name already
resolves; the `--add-host` line is what makes it work on Linux.

> **See it without running anything.** This kit runs on every push, and its report is
> published here: **<https://karatelabs.github.io/karate-agent-examples/mcp/>**

## How a check is written

A session is opened on the `mcp` channel, then driven. The first verb connects and negotiates:

```cucumber
* def mcp = karate.channel('mcp')
* def added = mcp.invoke('add_item', { sku: 'WIDGET-1', name: 'Widget', qty: 4 })
* match added.structuredContent == { sku: 'WIDGET-1', name: 'Widget', qty: 4 }
* match mcp.invoke('get_item', { sku: 'WIDGET-1' }).structuredContent.qty == 4
```

The url is not repeated in every check — it is set once in `karate-boot.js` and inherited. A result
comes back exactly as the server sent it, so `structuredContent` and the text block are both there:
`karate.fromString(response.content[0].text)` parses the text one.

**Session keys:** `url` · `headers` · `timeout` · `revision` · `capabilities` · `server` · `connect()` ·
`tools()` · `resources()` · `prompts()` · `invoke()` · `call()` · `stop()`

`mcp.server` is what the negotiation settled on — `lane`, `revision`, the server's capabilities — so a
check can assert the era it is running against. `headers` is where auth goes.

## Two kinds of failure

A **tool's own error is a result.** The protocol call succeeded; the tool refused. It arrives as an
ordinary result with `isError` set, the step passes, and you assert the refusal like any other value:

```cucumber
* def response = mcp.invoke('get_item', { sku: 'GHOST-1' })
* match response.isError == true
* match response.content[0].text == 'no item with sku GHOST-1'
```

A **protocol error is a failed step.** `invoke()` throws on a JSON-RPC error envelope, which is what you
want in a suite. When the error envelope is the thing under test, `call()` is the raw primitive — exactly
one request, no negotiation, and it never throws:

```cucumber
* def response = mcp.call('resources/read', { uri: 'inventory://nope' })
* match response.body.error.code == -32602
```

## Coverage

`karate-boot.js` points `cov.mcp` at `checks/mcp-tools.json` — a saved `tools/list` result, captured from
the running server. That catalog is the universe; every `tools/call` the checks make is an observed hit.
The report's **Coverage** tab shows five of the six tools covered and `remove_item` NOTCOVERED, because
no check calls it; the unknown tool name in the error check shows up beside it as an unmatched call.
Regenerate the file whenever the catalog changes — it is data in git, so a tool that appears or
disappears is a reviewable diff.

## Two deliberate warts

The demo server ships two things a real catalog should not have:

- `search_items` is described as just `"Search."` — a model choosing between tools has nothing to go on.
- `limit` is a **string** on `list_items` and a **number** on `search_items` — the same concept, two
  types, so an agent has to guess per tool.

Both are harmless to the checks, which pass either way. They are what agent-readiness lint flags.

## The official conformance suite

Karate tests *your* tools, results, side effects and coverage. Protocol-role conformance is the
[official suite](https://www.npmjs.com/package/@modelcontextprotocol/conformance)'s job, and the two
compose — run it against the same server:

```bash
npx @modelcontextprotocol/conformance@0.1.16 server --url http://localhost:3001/mcp
```

Against this demo server that reports **9 passed, 21 failed** of 30 scenarios. The failures are not
defects: the suite drives fixture tools, resources and prompts by name — images, audio, embedded
resources, sampling, elicitation, subscriptions, logging, completion — none of which a six-tool
inventory server implements. The nine that pass are the ones it does implement: initialize, ping,
`tools/list`, a simple `tools/call`, a tool error, `resources/list`, `prompts/list`, DNS-rebinding.

## Field study

Eight public MCP servers were driven through this same client and their catalogs and error behavior
saved verbatim — the negotiated protocol era, the full `tools/list` result, and two deliberate bad
calls each. The captures, the metrics computed from them and what they say about catalog size, error
envelopes and description quality are in [`field-study/`](field-study/).

## Pointing this at your own server

Change the url in `karate-boot.js`, regenerate `checks/mcp-tools.json` from your server's `tools/list`
result, and rewrite the checks against your tools. Delete `server/` — it exists only so this example
runs standalone.
