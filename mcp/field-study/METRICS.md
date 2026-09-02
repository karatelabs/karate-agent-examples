# MCP field study — catalog metrics

Generated from the captures in this folder — never hand-edited. Sizes are characters of the `tools` array serialized as strict JSON (the era envelope is excluded); `~tokens` is `chars / 4`, an approximation — catalog JSON is code-dense, so it undercounts.

| server | eras | tools | chars | ~tokens | params (sum/max) | optional % | depth max | desc chars (median) | params described % | vacuous (tool/param) | name collisions | param overload | bad call: unknown tool | bad call: missing arg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| apify | 2026-07-28+2025-11-25 | 12 | 73475 | 18368 | 40/8 | 68% | 2 | 728 | 100% | 0/0 | 0/0 | 2 (limit, offset) | jsonrpc -32602 | jsonrpc -32602 |
| cloudflare-docs | 2026-07-28+2025-11-25 | 2 | 1793 | 448 | 1/1 | 0% | 1 | 66 | 0% | 0/1 | 0/0 | 0 | jsonrpc -32602 | isError |
| context7 | 2026-07-28+2025-11-25 | 2 | 4870 | 1217 | 4/2 | 0% | 1 | 429 | 100% | 0/0 | 0/0 | 0 | jsonrpc -32602 | isError |
| deepwiki | 2025-11-25 | 3 | 1516 | 379 | 4/2 | 0% | 2 | 59 | 100% | 0/0 | 0/0 | 1 (repoName) | isError | isError |
| docling | 2026-07-28+2025-11-25 | 19 | 20844 | 5211 | 35/4 | 14% | 3 | 300 | 100% | 0/0 | 0/0 | 0 | isError | isError |
| exa | 2025-11-25 | 2 | 2142 | 535 | 4/2 | 50% | 2 | 270 | 100% | 0/0 | 0/0 | 0 | isError | isError |
| llamacloud | 2025-06-18 | 25 | 26626 | 6656 | 91/6 | 67% | 3 | 224 | 100% | 0/0 | 0/0 | 1 (limit) | jsonrpc -32602 | jsonrpc -32602 |
| microsoft-learn | 2025-06-18 | 3 | 4858 | 1214 | 4/2 | 50% | 1 | 894 | 100% | 0/0 | 0/0 | 0 | jsonrpc -32602 | isError |

## Pairs — context7 vs deepwiki

| metric | context7 | deepwiki |
| --- | --- | --- |
| eras | 2026-07-28+2025-11-25 | 2025-11-25 |
| tools | 2 | 3 |
| chars | 4870 | 1516 |
| ~tokens | 1217 | 379 |
| params (sum/max) | 4/2 | 4/2 |
| optional % | 0% | 0% |
| depth max | 1 | 2 |
| desc chars (median) | 429 | 59 |
| params described % | 100% | 100% |
| vacuous (tool/param) | 0/0 | 0/0 |
| name collisions | 0/0 | 0/0 |
| param overload | 0 | 1 (repoName) |
| bad call: unknown tool | jsonrpc -32602 | isError |
| bad call: missing arg | isError | isError |

## Pairs — llamacloud vs docling

| metric | llamacloud | docling |
| --- | --- | --- |
| eras | 2025-06-18 | 2026-07-28+2025-11-25 |
| tools | 25 | 19 |
| chars | 26626 | 20844 |
| ~tokens | 6656 | 5211 |
| params (sum/max) | 91/6 | 35/4 |
| optional % | 67% | 14% |
| depth max | 3 | 3 |
| desc chars (median) | 224 | 300 |
| params described % | 100% | 100% |
| vacuous (tool/param) | 0/0 | 0/0 |
| name collisions | 0/0 | 0/0 |
| param overload | 1 (limit) | 0 |
| bad call: unknown tool | jsonrpc -32602 | isError |
| bad call: missing arg | jsonrpc -32602 | isError |
