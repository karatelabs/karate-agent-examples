@ignore
Feature: helper - price a quote and bind a policy from it

  # args (all optional): state, coverage, driverAge, priorClaims, holder
  Scenario:
    * def quoteReq = { state: '#(karate.get("state", "CA"))', coverage: '#(karate.get("coverage", "LIABILITY"))', driverAge: '#(karate.get("driverAge", 40))', priorClaims: '#(karate.get("priorClaims", false))' }
    Given url baseUrl
    And path 'quotes'
    And request quoteReq
    When method post
    Then status 201
    * def quote = response

    * def holderName = karate.get('holder', 'holder-' + java.util.UUID.randomUUID())
    Given url baseUrl
    And path 'policies'
    And request { quoteId: '#(quote.id)', holder: '#(holderName)' }
    When method post
    Then status 201
    * def policy = response
