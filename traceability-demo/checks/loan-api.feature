Feature: Loan Decision API agrees with the personal-loan rules, per scenario

  The REST twin of the UI check. `baseUrl` is the in-process Loan Decision API mock (karate-config.js
  auto-starts mock/loan-mock.feature). Each row POSTs an application to `POST /decisions` — lighting
  `cov.openapi` for that operation — and asserts the API's decision + APR equal the personal-loan rules
  oracle (`Rule.execute`), row by row. The `@req=` tokens link the API coverage to the SAME requirements
  (3..6) the rules and the UI cover, so API hits + rule hits + requirement coverage land in ONE RTM.
  The closing `check.verify(...)` stamps that the SYSTEM agreed with the rules — it emits per criterion
  for exactly the criteria that rule run realized, which is what clears the RTM's `rules only`
  (oracleOnly) disclosure; a drifted API turns the stamp into a test failure.
  TWO gaps are left DELIBERATELY, so the published report demonstrates the governance teeth:
    • getDecision — GET /decisions/{id} — is never called: the honest endpoint gap Coverage.gaps() flags;
    • the `approve-loyalty` row is asserted like every other but NOT stamped, so its criterion (6/ac4)
      stays `rules only` and blocks the readiness verdict — every test green, yet NOT READY.
  Drop the `if` around the stamp (stamp every row) and the verdict goes READY — try it.

  Background:
    * url baseUrl

  @req=3/ac1 @req=4/ac1 @req=5/ac1 @req=6/ac1
  Scenario Outline: <_id> — <_label>
    * def app = { creditScore: '#(__row.creditScore)', annualIncome: '#(__row.annualIncome)', loanAmount: '#(__row.loanAmount)', termMonths: '#(__row.termMonths)', monthlyDebt: '#(__row.monthlyDebt)', existingCustomer: '#(__row.existingCustomer)' }
    Given path 'decisions'
    And request app
    When method post
    Then status 200
    * def check = Rule.execute('personal-loan', __row)
    * def oracle = check.output
    And match response.decision == oracle.decision
    And match response.apr == oracle.apr
    # deliberate demo gap (see the feature header): the loyalty case is asserted above, but not STAMPED
    * eval if (__row._id != 'approve-loyalty') check.verify(true, 'the Loan Decision API agrees with the personal-loan rules')

    Examples:
      | Rule.load('personal-loan').scenarios |
