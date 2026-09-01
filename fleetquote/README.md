# fleetquote — a stateful quote lifecycle, from prose to a running SUT

Stonebridge Fleet Auto: commercial fleets are submitted, rated, sometimes referred and approved, and
bound into a policy. The kit is the whole chain on one small domain — a prose source of truth
(`SOT-prose.md`, written the way an underwriting guide actually arrives), the requirements read off
it (`requirements/fleet-auto.md`, EARS criteria + `open-questions.md` for what the guide leaves
open), the `rating` rulebook that realizes them, an OpenAPI contract, a stateful mock, and the checks
that join all of it.

**The state is the point.** The answer depends on what happened before — a quote must be rated before
it binds, a referral needs approval, a declined quote is terminal, and a rated quote goes stale after
60 days. Order is part of the answer, so the whole chain is exercised as a chain.

**The rulebook is the only pricing authority.** `mock/handlers.js` calls
`Rule.execute('rating', submission)` and copies out the premium, the reason and the outcome — no
premium number is encoded in the mock or pinned in any check. The mock owns the *lifecycle*; the
rulebook owns the *price*.

## The surface

Five operations, all under `openapi.yaml` (plus the clock, below):

| operation | what it does |
| --- | --- |
| `submitQuote` — `POST /quotes` | records a submission, status `submitted` |
| `getQuote` — `GET /quotes/{quoteId}` | reads a quote back |
| `rateQuote` — `POST /quotes/{quoteId}/rate` | prices via the rulebook, stamps `ratingDate` |
| `approveQuote` — `POST /quotes/{quoteId}/approve` | underwriter approval, premium unchanged |
| `bindQuote` — `POST /quotes/{quoteId}/bind` | issues the policy |

A quote carries one of six statuses — `submitted` · `rated` · `referred` · `approved` · `declined` ·
`bound` — and *expired* is a seventh, derived state: a quote more than 60 days past its `ratingDate`
refuses every action until it is re-rated. The refusals are typed: `invalid_input` · `no_vehicles` ·
`not_found` · `not_rated` · `declined_terminal` · `already_bound` · `not_referred` · `quote_expired`
· `approval_required`.

## Run it

`java -jar karate-agent-2.1.3.RC2.jar serve` anchors a console (+ `/api/eval` + `/api/mcp`)
on this project — no maven, no docker — on `:4444`. It starts the console only, never the SUT.
From that console:

```js
var mock = File.call('/mock/start.js')   // Http.mock({openapi:'/openapi.yaml', port:8090, handlers})
mock.url                                 // -> http://localhost:8090
Runner.run('checks')                     // the lifecycle + rating suites against it
```

`start.js` also accepts an options object: `File.call('/mock/start.js', { … })`.

`karate-boot.js` binds the rules ext (so the mock can call `Rule.execute`) and `karate-config.js`
points `baseUrl` at `:8090`. The mock is stateful in one shared session — quotes and the clock
persist for the life of the instance.

### The clock is on the wire

Expiry needs a movable "today", and it is a declared operation rather than a header, so a driver that
can only send `{method, path, body}` still reaches it:

```
POST /clock  {"today":"2026-01-10"}   -> 200 {"today":"2026-01-10"}   # fixes it for every later call
GET  /clock                           -> 200 {"today":"…"}            # the fixed date, else the real one
POST /clock  {"today":"nope"}         -> 400 {"error":"invalid_input", …}
```

It is a **test-only control** — `openapi.yaml` says so in both descriptions — and the only clock:
nothing reads the wall date once it is set.

## No twin ships here

`rulebooks/rating/` carries `calc.js` · `schema.js` · `generator.js` · `scenarios.json` and no
`twin.js` / `sequences.json`. The lifecycle lives in `SOT-prose.md` section 5 and in the mock; a model of it
is written into a workspace copy, never into this one.

`acceptance.json` is the required-row deck that model is graded against — the eight states, the
eighteen transitions and the fourteen rejections the guide demands, as `{rows, sha}`. `J08` carries
`world: {status: "APPROVED"}` so it demands the approved-then-expired path its own reason describes
rather than `J06`'s, and `T18` pins the day-60 boundary `FLEET-OQ-004` leaves open.

## Files

```
fleetquote/
  SOT-prose.md              # the underwriting guide extract — the prose source of truth
  requirements/             # fleet-auto.md (EARS criteria, FLEET-001..010) · open-questions.md
  rulebooks/rating/         # the ORACLE: calc.js (with calc.req links) · schema.js · generator.js · scenarios.json
  acceptance.json           # the required-row deck {rows, sha} a twin of the lifecycle is graded against
  openapi.yaml              # the quote API contract (coverage universe) + the test-only /clock
  mock/                     # start.js (Http.mock on :8090) · handlers.js (the lifecycle, priced by the rulebook)
  checks/                   # lifecycle.feature (the state machine) · rating.feature (every saved row, live vs the rulebook)
  demo/                     # a worked twin of the lifecycle + its pinned sequences (see demo/README.md)
  karate-boot.js  karate-config.js
```
