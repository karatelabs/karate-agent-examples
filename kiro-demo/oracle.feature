Feature: Loan Decisioning rules oracle — every decision arm, headless

  Run the loan-decisioning rules over each stored application and assert the outcome (and APR) is the one
  expected for that row — an independent expectation per row, so a drift in calc.js turns a row red rather
  than agreeing with itself. Each row's `Rule.execute` emits the rulebook's `calc.req` hits, so the criteria
  those arms realize light up in the traceability matrix.

  Background:
    # apr is a fraction (0.149 = 14.9%); a declined application carries none.
    * def expected =
    """
    {
      'decline-low-score':      { outcome: 'DECLINED',       apr: null  },
      'decline-high-dti':       { outcome: 'DECLINED',       apr: null  },
      'review-borderline-score':{ outcome: 'MANUAL_REVIEW',  apr: 0.149 },
      'approve-prime':          { outcome: 'APPROVED',       apr: 0.065 },
      'approve-midband':        { outcome: 'APPROVED',       apr: 0.099 }
    }
    """

  Scenario Outline: <_id> — <_label>
    * def result = Rule.execute('loan-decisioning', __row).output
    * def exp = expected[__row._id]
    * match result.outcome == exp.outcome
    * match result.apr == exp.apr

    Examples:
      | Rule.load('loan-decisioning').scenarios |
