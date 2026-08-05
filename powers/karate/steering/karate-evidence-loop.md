# Is the work actually verified?

This is the question Karate exists to answer, and the one worth reaching for it over. A green test run says a test passed. It does not say the thing you were asked to build is covered. Karate closes that distance: every check declares the requirement or acceptance criterion it exercises, and the engine derives — deterministically, with no model in the loop — which criteria have a passing check behind them and which do not.

**Report what the evidence shows, not what you intended.** A criterion with no passing check is unverified. Say so plainly, then offer to write the missing check. That is the whole value of having this power installed; softening it removes the point.

## The loop

1. **Know what has to be true.** If this workspace carries a spec, its acceptance criteria are the list. Otherwise the requirements live in the project — `Requirement.list()`.
2. **Author checks that declare what they verify.** A check states the criterion it exercises; that declaration is what the traceability is built from, and it is easy to get subtly wrong — follow `Skill.help('requirements')` rather than guessing the tag form.
3. **Run them.** `Skill.help('launch')` for a whole suite in one command, `Skill.help('coverage')` for what a run records.
4. **Read the verdict, not the exit code:**

```js
Requirement.matrix()        // every requirement × what covers it
Requirement.gaps()          // no passing check, untested criteria, hollow links
Requirement.readiness()     // the confidence-to-ship verdict + its blockers
Coverage.gaps()             // what the run did not touch
```

Each takes `{output:'both'}` to add a rendered scorecard alongside the data — use it when you are reporting to a human.

**A verdict is never cacheable.** It is derived from the last run, and it changes the moment anything runs — including a run someone started in a terminal you cannot see. When the question is asked again, ask the engine again; never repeat an earlier answer from memory, however recent. `runEvidence` on the reply says how much run evidence is behind it: `tests: 0` means nothing has run yet, so *every* status reads NOTCOVERED because nothing was checked — which is not the same finding as a run that checked and missed.

5. **Leave the artifact.** The run produces one HTML report with the coverage and the traceability matrix in it — `Skill.help('coverage')` covers publishing it. It is the thing that outlives the conversation.

Before anything has been run, `Runner.suite(path, {dryRun:true})` answers *"which requirements have a check at all?"* without executing a step — useful the moment a spec grows a new criterion.

## "Which completed tasks aren't actually verified?"

When the workspace carries a spec whose tasks are ticked off as done — a task list, an implementation plan, a checklist of work items — those ticks are **claims**, and Karate reads them alongside the criteria they say they satisfy. `Requirement.readiness()` returns `claimedUnverified`: every criterion some completed task claims and no passing check backs, each named with the task that claimed it. That is the whole answer to *"is the work really done?"*, already joined — do not reconstruct it by reading the task list and matching ids up yourself. A criterion in that list is work someone marked complete that nothing verifies: report it that way, name the task, and offer to write the check.

## Concepts

`Help.page('<id>')` returns a whole help page; `Help.search('<term>')` finds the right one when you do not know the id. (A dotted slug a user pastes from a report — `rule.execute`, `model.coverage.oracleonly` — is a *help-id*, not a page: resolve those with `Help.get('<id>')`, and `Help.topics()` lists them all.) The pages:

| `Help.page(...)` | |
|---|---|
| `getting-started` | Getting started |
| `install` | Install & licensing |
| `paths` | Paths — one root, one rule |
| `datasheet` | Product Datasheet |
| `glossary` | The model & glossary |
| `requirement` | Requirements & traceability |
| `rules` | Rules & oracles |
| `check` | Checks |
| `run` | Runs & working memory |
| `coverage` | Coverage & reports |
| `openapi` | API specs |
| `contract` | Contract testing — mock vs provider |
| `governance` | API governance — the graded spec |
| `mock` | Mocks |
| `http` | Http — live exploration |
| `match` | match — assertions |
| `runner` | Runner — running suites |
| `launch` | Launch — one-command suites & CI |
| `graph` | Graph — the traceability graph |
| `robot` | Robot — browser automation |
| `skill` | Skills |
