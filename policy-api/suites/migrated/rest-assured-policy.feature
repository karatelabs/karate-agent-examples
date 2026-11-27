@imported-from-rest-assured
Feature: Policy API — migrated from REST-assured PolicyApiTest

  # Source: legacy/rest-assured/src/test/java/com/acme/policy/PolicyApiTest.java
  # 4 tests, 15 assertions — one Scenario per test, each assertion kept 1:1.

  Background:
    * url baseUrl

  Scenario: quotes a preferred driver in New York
    Given path 'quotes'
    And request { state: 'NY', coverage: 'COMPREHENSIVE', driverAge: 30, priorClaims: false }
    When method post
    Then status 201
    And match response.id == '#notnull'
    And match response.policyClass == 'PREFERRED'
    And match response.monthlyPremium == 155
    And match response.currency == 'USD'

  Scenario: a young driver with prior claims is substandard
    Given path 'quotes'
    And request { state: 'TX', coverage: 'LIABILITY', driverAge: 21, priorClaims: true }
    When method post
    Then status 201
    And match response.policyClass == 'SUBSTANDARD'
    And match response.monthlyPremium == 125

  Scenario: binds a policy and fetches it by id
    Given path 'quotes'
    And request { state: 'WA', coverage: 'COLLISION', driverAge: 45, priorClaims: false }
    When method post
    Then status 201
    * def quoteId = response.id

    Given path 'policies'
    And request { quoteId: '#(quoteId)', holder: 'Dorothy Vaughan' }
    When method post
    Then status 201
    And match response.status == 'BOUND'
    And match response.holder == 'Dorothy Vaughan'
    * def policyId = response.id

    Given path 'policies', policyId
    When method get
    Then status 200
    And match response.id == policyId
    And match response.quoteId == quoteId

  Scenario: lists policies filtered by state
    Given path 'quotes'
    And request { state: 'WA', coverage: 'LIABILITY', driverAge: 52, priorClaims: false }
    When method post
    Then status 201
    * def quoteId = response.id

    Given path 'policies'
    And request { quoteId: '#(quoteId)', holder: 'Mary Jackson' }
    When method post
    Then status 201

    Given path 'policies'
    And param state = 'WA'
    When method get
    Then status 200
    And match each response[*].state == 'WA'
    And match response[*].holder contains 'Mary Jackson'
