Feature: Loan Decision API agrees with the personal-loan rules, per scenario

  The REST twin of the UI check. `baseUrl` is the in-process Loan Decision API mock (karate-config.js
  auto-starts mock/loan-mock.feature). Each row POSTs an application to `POST /decisions` — lighting
  `cov.openapi` for that operation — and asserts the API's decision + APR equal the personal-loan rules
  oracle (`Rule.execute`), row by row. The `@req=` tokens link the API coverage to the SAME requirements
  (3..6) the rules and the UI cover, so API hits + rule hits + requirement coverage land in ONE RTM.
  (getDecision — GET /decisions/{id} — is left uncovered: the honest gap the RTM/Coverage.gaps() flags.)

  Background:
    * url baseUrl

  @req=3/ac1 @req=4/ac1 @req=5/ac1 @req=6/ac1
  Scenario Outline: <id> — <label>
    * def app = { creditScore: '#(__row.creditScore)', annualIncome: '#(__row.annualIncome)', loanAmount: '#(__row.loanAmount)', termMonths: '#(__row.termMonths)', monthlyDebt: '#(__row.monthlyDebt)', existingCustomer: '#(__row.existingCustomer)' }
    Given path 'decisions'
    And request app
    When method post
    Then status 200
    * def oracle = Rule.execute('personal-loan', __row).output
    And match response.decision == oracle.decision
    And match response.apr == oracle.apr

    Examples:
      | read('/rulebooks/personal-loan/scenarios.json') |
