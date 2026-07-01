Feature: Loan Desk rules oracle — headless (the CI-safe pipeline stage)

  A browser-free suite: run the personal-loan rules over each scenario row and assert the decision (+ APR)
  matches the expected outcome. Every row's `Rule.execute` emits the rulebook's `calc.req` hits, so the RTM
  lights each requirement (3..6). When the run supplies the ADO coordinates (KARATE_ADO_ORG /
  KARATE_ADO_PROJECT, see karate-boot.js) each id also click-throughs to its Azure DevOps User Story;
  otherwise the ids stay plain text (the pure-git / spec-driven posture). This is the CI-safe first stage;
  the flagship browser stage is `loan-rate-ui.feature` (drives the SUT with `bot`, non-headless + video).

  Background:
    # the independent expectation per scenario id (so a calc.js drift turns a row red — a real oracle test,
    # not calc-vs-itself). apr is the rules fraction (0.149 = 14.9%); a declined application carries none.
    * def expected =
    """
    {
      'decline-low-score': { decision: 'declined',      apr: null  },
      'decline-high-dti':  { decision: 'declined',      apr: null  },
      'review-score-band': { decision: 'manual-review', apr: 0.149 },
      'review-dti-band':   { decision: 'manual-review', apr: 0.065 },
      'approve-prime':     { decision: 'auto-approved', apr: 0.065 },
      'approve-midband':   { decision: 'auto-approved', apr: 0.099 },
      'approve-loyalty':   { decision: 'auto-approved', apr: 0.060 }
    }
    """

  Scenario Outline: <id> — <label>
    * def result = Rule.execute('personal-loan', __row).output
    * def exp = expected[__row.id]
    * match result.decision == exp.decision
    * match result.apr == exp.apr

    Examples:
      | read('rulebooks/personal-loan/scenarios.json') |
