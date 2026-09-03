# fleetquote — a stateful quote lifecycle, from prose to a running service

Stonebridge Fleet Auto rates commercial vehicle fleets. Submit a quote. Rate it. Refer and approve it
when required. Bind it into a policy. The kit carries that whole chain. It holds a prose guide
(`SOT-prose.md`) and the requirements read off it. It also holds the `rating` rulebook, an OpenAPI
contract, a stateful mock, and the checks.

**Start here: [`TUTORIAL.md`](TUTORIAL.md)** — an evaluation path, one question per section, with the
commands and the output the engine produces.

**The rulebook is the only pricing authority.** `mock/handlers.js` calls
`Rule.execute('rating', submission)`. It copies out the premium, the reason and the outcome. No premium
lives in the mock, and no check pins one. The mock owns the lifecycle, the rulebook the price.

## The surface

`openapi.yaml` declares five operations — `submitQuote` (`POST /quotes`), `getQuote`, `rateQuote`,
`approveQuote` and `bindQuote` — plus a test-only `/clock`. Expiry needs a movable "today". The clock is
an operation, not a header. `POST /clock {"today":"2026-01-10"}` fixes it for every later call.

A quote carries one of six statuses: `submitted` · `rated` · `referred` · `approved` · `declined` ·
`bound`. *expired* is a seventh, derived state. The refusals are typed: `invalid_input` ·
`no_vehicles` · `not_found` · `not_rated` · `declined_terminal` · `already_bound` · `not_referred` ·
`quote_expired` · `approval_required`.

## Run it

`java -jar karate-agent-2.1.3.RC3.jar serve` starts the console on port 4444. It also serves
`/api/eval` and `/api/mcp` for this project. It needs no maven and no docker. It starts the console only,
never the SUT. From that console:

```js
var mock = File.call('/mock/start.js')   // Http.mock({openapi:'/openapi.yaml', port:8090, handlers})
mock.url                                 // -> http://localhost:8090
Runner.run('checks')                     // the lifecycle + rating suites against it
```

The container image carries the same console, and the kit mounts as the project:

```bash
docker run --rm -p 4444:4444 -v "$PWD":/work/fleetquote \
  -e KARATE_LICENSE_TEXT="$(cat karate.lic)" \
  public.ecr.aws/karatelabs/karate-agent:2.1.3.RC3 serve
```

`start.js` also accepts options: `File.call('/mock/start.js', { … })`. Use one option to seed one
defect. The defect list is at the top of `mock/handlers.js`. `rollout` is the order-dependent bind defect
the tutorial walks. `mislabel` refuses the expired bind under the wrong reason code. Nine more options
cover the other lifecycle guards. Each seeded defect counts a hit under `mock.var('hits')`.

## The twin ships here

`rulebooks/rating/` carries the lifecycle model `twin.js` and 43 pinned orders in `sequences.json`. The
twin models 8 states, and it follows the prose guide `SOT-prose.md`. The required-row deck
`acceptance.json` lists 18 required transitions and 14 required rejections, as `{rows, sha}`. Section 9
of the tutorial walks the model and grades it against that deck. It also replays the orders against the
mock.

## Files

```
fleetquote/
  SOT-prose.md              # the underwriting guide extract — the prose source of truth
  requirements/             # fleet-auto.md (EARS criteria, FLEET-001..010) · open-questions.md
  rulebooks/rating/         # calc.js · schema.js · generator.js · scenarios.json · twin.js · sequences.json
  acceptance.json           # the required-row deck {rows, sha} that grades the twin
  openapi.yaml              # the quote API contract + the test-only /clock
  mock/                     # start.js (Http.mock on :8090) · handlers.js (the lifecycle, priced by the rulebook)
  checks/                   # lifecycle.feature (the state machine) · rating.feature (every saved row, live vs the rulebook)
  karate-boot.js  karate-config.js
```
