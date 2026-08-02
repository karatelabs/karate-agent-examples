Feature: POST /decisions agrees with the loan-decisioning rules

  The HTTP surface of the same decisions. `baseUrl` is the in-process service (karate-config.js auto-starts
  mock/decision-mock.feature). The row-driven scenario posts each stored application and asserts the API's
  outcome and APR equal the rules oracle's, so the endpoint and the rulebook cannot drift apart. The
  validation scenarios cover the rejection criteria, which the rules do not model (validation is an edge
  concern, not a decision arm).

  Background:
    * url baseUrl

  @req=loan-decisioning.1/1
  Scenario: a missing required field is rejected, naming the field
    Given path 'decisions'
    And request { creditScore: 720, annualIncome: 90000, requestedAmount: 12000, termMonths: 60, isExistingCustomer: false }
    When method post
    Then status 400
    And match response.field == 'existingMonthlyDebt'

  @req=loan-decisioning.1/2
  Scenario: a credit score outside 300-850 is rejected, naming the field
    Given path 'decisions'
    And request { creditScore: 900, annualIncome: 90000, requestedAmount: 12000, termMonths: 60, existingMonthlyDebt: 500, isExistingCustomer: false }
    When method post
    Then status 400
    And match response.field == 'creditScore'

  @req=loan-decisioning.2/1 @req=loan-decisioning.2/2 @req=loan-decisioning.3/1 @req=loan-decisioning.3/2
  Scenario Outline: <_id> — <_label>
    * def application = { creditScore: '#(__row.creditScore)', annualIncome: '#(__row.annualIncome)', requestedAmount: '#(__row.requestedAmount)', termMonths: '#(__row.termMonths)', existingMonthlyDebt: '#(__row.existingMonthlyDebt)', isExistingCustomer: '#(__row.isExistingCustomer)' }
    Given path 'decisions'
    And request application
    When method post
    Then status 200
    * def oracle = Rule.execute('loan-decisioning', __row).output
    And match response.outcome == oracle.outcome
    And match response.apr == oracle.apr

    Examples:
      | read('rulebooks/loan-decisioning/scenarios.json') |
