Feature: rating rules oracle — headless (the CI-safe pipeline stage)

  Run the `rating` rulebook over each saved scenario and assert the monthly premium matches an INDEPENDENT
  expectation (so a calc.js drift turns a row red — a real oracle test, not calc-vs-itself). Every row's
  `Rule.execute` emits the rulebook's `calc.req` hits, so the run's RTM lights each requirement the saved
  scenarios reach — RATE-001/1 (young-driver loading) and RATE-002/1 (prior-claims surcharge) — while the
  senior-driver arm (RATE-001/2) stays the honest gap no scenario exercises. The REST covering-array
  coverage (checks/quotes.feature) and this requirement coverage ride the SAME run report, so the published
  report carries the Coverage view AND the Traceability RTM together.

  Background:
    # the independent expectation per scenario id (hand-derived from the rate rules, so a calc.js edit that
    # changes a premium turns its row red). currency is always USD.
    * def expected =
    """
    {
      'young-collision-ca':            { monthlyPremium: 140 },
      'prior-claims-comprehensive-ny': { monthlyPremium: 190 },
      'clean-liability-tx':            { monthlyPremium: 50  }
    }
    """

  Scenario Outline: <id> — <label>
    * def result = Rule.execute('rating', __row).output
    * def exp = expected[__row.id]
    * match result.monthlyPremium == exp.monthlyPremium
    * match result.currency == 'USD'

    Examples:
      | read('../rulebooks/rating/scenarios.json') |
