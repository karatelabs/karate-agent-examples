# demo — a twin of the lifecycle, and the defect it finds

A **twin** is a small behaviour model of the service: its states, its commands, and what each command
is allowed to do. Karate walks the model, replays the same orders against the running service, and
reports every step where the two disagree.

This twin was authored **cold, by an agent**, from the prose guide and the required-row deck in
`../acceptance.json` — the states, the reason strings and the wire mapping are its own work, not a
transcript of the mock.

## Run it

Serve the project, then from the console:

```js
var mock = File.call('/mock/start.js', { rollout: true })    // the seeded defect is behind this option
Rule.twin.update('rating', File.read('/demo/twin.js'))       // install the model
File.write('/rulebooks/rating/sequences.json', File.read('/demo/sequences.json'))
Twin.check('rating', { required: read('/acceptance.json') })
Twin.live('rating', { baseUrl: mock.url, against: 'live' })
```

`Twin.check` reaches all 39 required rows in the model. `Twin.live` then replays the 43 pinned orders
against the running service, one disposition each: **42 PASS, 1 FAIL**.

## The finding

`seq-bind-expired-approved`, step 4 — **the service binds an APPROVED quote whose 60-day validity has
lapsed.** Rate a quote, approve it, move the clock past day 60, then bind: the guide says
`409 quote_expired`, the service issues a policy. The controls are clean, so the defect is narrow —
the same lapse is refused on `bind` for a `rated` quote and for a `referred` one, and refused on
`approve`. Only `bind` on an `approved` quote skips the validity window.

Restart the mock without the option — `File.call('/mock/start.js')` — and that sequence clears.
