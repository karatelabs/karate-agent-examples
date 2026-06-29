Feature: insurance Policy API — quote → bind → claim lifecycle (REST / OpenAPI)

  # baseUrl is the in-process Policy API mock (karate-config.js auto-starts mock/policy-mock.feature).
  # Each scenario exercises an OpenAPI operation so cov.openapi grades which were hit. cancelPolicy
  # (DELETE /policies/{id}) and getClaim (GET /claims/{id}) are left as the worklist Coverage.gaps() shows.

  Background:
    * url baseUrl

  Scenario: price a quote (the REST front door to the rating engine)
    Given path 'quotes'
    And request { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    And match response.monthlyPremium == 100
    And match response.currency == 'USD'

  Scenario: bind a policy from a quote
    Given path 'policies'
    And request { quoteId: 'q-123', holder: 'Ada Lovelace' }
    When method post
    Then status 201
    And match response.status == 'BOUND'

  Scenario: list policies
    Given path 'policies'
    When method get
    Then status 200
    And match response == '#array'

  Scenario: fetch a missing policy is a 404
    Given path 'policies', 'does-not-exist'
    When method get
    Then status 404

  Scenario: file a claim against a policy
    Given path 'claims'
    And request { policyId: 'p-123', amount: 2500, description: 'rear-end collision' }
    When method post
    Then status 201
    And match response.status == 'OPEN'
