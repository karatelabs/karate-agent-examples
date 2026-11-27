@imported-from-readyapi
Feature: Policy API Regression — migrated from the ReadyAPI project

  # Source: legacy/readyapi/Policy-API-readyapi-project.xml (test suite "Policy API Regression")
  # 3 test cases, 10 assertions — one Scenario per test case, each <con:assertion> kept 1:1.
  # ${#Project#endpoint} -> baseUrl; ${<step>#Response#$.id} property transfers -> def.

  Background:
    * url baseUrl

  Scenario: Quote - California collision, preferred driver
    Given path 'quotes'
    And request { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    And match response.id == '#present'
    And match response.policyClass == 'PREFERRED'
    And match response.monthlyPremium == 100

  Scenario: Bind - unknown quote is rejected
    Given path 'policies'
    And request { quoteId: 'q-never-issued', holder: 'Hedy Lamarr' }
    When method post
    Then status 400
    And match response.field == 'quoteId'
    And match response.error contains 'no such quote'

  Scenario: Claim - zero amount is rejected
    Given path 'quotes'
    And request { state: 'NY', coverage: 'LIABILITY', driverAge: 33, priorClaims: false }
    When method post
    Then status 201
    * def quoteId = response.id

    Given path 'policies'
    And request { quoteId: '#(quoteId)', holder: 'Evelyn Boyd Granville' }
    When method post
    Then status 201
    * def policyId = response.id

    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 0 }
    When method post
    Then status 400
    And match response.field == 'amount'
