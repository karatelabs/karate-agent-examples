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

5. **Leave the artifact.** The run produces one HTML report with the coverage and the traceability matrix in it — `Skill.help('coverage')` covers publishing it. It is the thing that outlives the conversation.

Before anything has been run, `Runner.suite(path, {dryRun:true})` answers *"which requirements have a check at all?"* without executing a step — useful the moment a spec grows a new criterion.

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
| `mock` | Mocks |
| `http` | Http — live exploration |
| `match` | match — assertions |
| `runner` | Runner — running suites |
| `launch` | Launch — one-command suites & CI |
| `graph` | Graph — the traceability graph |
| `robot` | Robot — browser automation |
| `skill` | Skills |
