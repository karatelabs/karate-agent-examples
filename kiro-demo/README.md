# kiro-demo — is the work your AI coding tool marked "done" actually verified?

*A Kiro spec as the requirement source · a ticked `tasks.md` as the completion claim · every claim graded
against real run evidence — in seconds, on a laptop, with no browser and nothing to install but the engine.*

Spec-driven development tools generate a spec, drive an agent to implement it, and record completion by
ticking a checkbox. That checkbox is the whole completion signal: **an agent said it finished**. Nothing in
the workflow checks whether anything verifies the acceptance criteria that task named.

This kit closes that loop. The requirements are read **straight out of the spec folder** — the file is not
copied, re-authored or reformatted — and every criterion a completed task claims is graded against what the
tests actually exercised. The suite here is **all green**, and the traceability matrix still says
**NOT READY**, for one honest reason.

## Run it

```
karate launch suite.karate.js
```

Twelve scenarios, about half a second, no browser and no server to start. Then open the report:

- `target/karate-reports/karate-summary.html` — the run, with **Coverage** and **Traceability** tabs.

Or serve the project and ask the questions directly (the same answers over HTTP and MCP):

```
karate serve --requirements-dir .kiro/specs .
```

```js
Requirement.readiness()      // the ship / don't-ship verdict, and why
Requirement.matrix()         // every requirement × its criteria × what covered them
Requirement.gaps()           // the worklist
```

## What you will see

Every scenario passes — and the verdict is **NOT READY**, with one blocker:

> *1 criterion marked done by task 5 but not verified (criterion 2 is NOTCOVERED) — the checkbox is a claim,
> not evidence; add the check that exercises it.*

Task 5 in `tasks.md` is ticked `- [x]` and says it implemented APR pricing, naming criteria 4.1, 4.2 and 4.3.
The implementation really is there — `sut/decision.js` applies the existing-customer discount. But no test in
this kit ever sends an existing customer, so **nothing verifies it**. A green suite and a real gap, at the
same time.

That is the point of the kit: the gap is not a bug anybody planted in the code. It is the ordinary distance
between *what was claimed* and *what was checked*, and it is invisible to a green build.

## Close the gap

Add an application with `"isExistingCustomer": true` to `rulebooks/loan-decisioning/scenarios.json` (and its
expected outcome in `oracle.feature`). Re-run. The criterion goes **COVERED**, requirement 4 goes green, and
the verdict flips to READY. Nothing else changes — no re-tagging, no bookkeeping.

## What's inside

- **`.kiro/specs/loan-decisioning/`** — the generated spec, exactly as a spec-driven tool writes it:
  `requirements.md` (numbered EARS acceptance criteria), `design.md`, and `tasks.md` with its checkboxes.
  This folder is the requirement source; `karate-boot.js` points at it with one line.
- **`sut/decision.js`** — the service the tasks describe: validation, the decline gate, routing, APR pricing.
- **`mock/decision-mock.feature`** — serves it at `POST /decisions`, in-process, on a free port.
- **`rulebooks/loan-decisioning/`** — the same decisions as an **executable rulebook**: the oracle. Each
  decision arm names the acceptance criterion it realizes, so running the rules is what lights those criteria
  in the matrix.
- **`oracle.feature`** — every decision arm, headless, against an independent expected outcome per row.
- **`decision-api.feature`** — the HTTP surface: the validation rejections, plus a row-driven check that the
  endpoint and the rulebook agree.
- **`openapi.yaml`** — the API contract, so operation coverage joins the same report.

## The ids

A requirement's id is derived from where it lives: the spec folder name plus its number —
`loan-decisioning.4` — and an acceptance criterion is `loan-decisioning.4/2`. Those are the ids a test names
in a `@req=` tag and a rule names in `calc.req(...)`, and they are what `tasks.md`'s `_Requirements: 4.2_`
back-references resolve to. Two requirements carry a `@criticality=high` line: an ordinary markdown line the
spec tool leaves untouched, which tells the readiness verdict which gaps are blockers.

## Reset between demos

Everything generated lives in `target/` and `runs/`, both gitignored:

```
rm -rf target runs
```
