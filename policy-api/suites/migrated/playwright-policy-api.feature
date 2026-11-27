@imported-from-playwright
Feature: Policy API — migrated from Playwright API mode

  # Source: legacy/playwright/tests/policy-api.spec.ts (+ playwright.config.ts extraHTTPHeaders)
  # 3 tests, 12 assertions — one Scenario per test, each expect() kept 1:1.

  Background:
    * url baseUrl
    * configure headers = { Accept: 'application/json' }

  Scenario: quotes a senior driver in Florida at the standard class
    Given path 'quotes'
    And request { state: 'FL', coverage: 'COMPREHENSIVE', driverAge: 75, priorClaims: false }
    When method post
    Then status 201
    And match response contains { policyClass: 'STANDARD', currency: 'USD' }
    And match response.monthlyPremium == 180

  Scenario: files a claim against a bound policy and the claim is open
    Given path 'quotes'
    And request { state: 'CA', coverage: 'LIABILITY', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    * def quote = response

    Given path 'policies'
    And request { quoteId: '#(quote.id)', holder: 'Annie Easley' }
    When method post
    Then status 201
    * def policy = response

    Given path 'claims'
    And request { policyId: '#(policy.id)', amount: 1200, description: 'windshield' }
    When method post
    Then status 201
    And match response.status == 'OPEN'
    And match response.amount == 1200

  Scenario: rejects a quote for a state the rate book does not cover
    Given path 'quotes'
    And request { state: 'NV', coverage: 'COLLISION', driverAge: 40 }
    When method post
    Then status 400
    And match response.field == 'state'
    And match response.error contains 'state must be one of'
