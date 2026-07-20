Feature: insurance Policy API — quote → bind → claim lifecycle (REST / OpenAPI)

  # baseUrl is the in-process Policy API mock (karate-config.js auto-starts mock/policy-mock.feature).
  # Each scenario exercises an OpenAPI operation so cov.openapi grades which were hit. cancelPolicy
  # (DELETE /policies/{id}) and getClaim (GET /claims/{id}) are left as the worklist Coverage.gaps() shows.

  Background:
    * url baseUrl

  # The one priced operation in the lifecycle — so the `rating` rulebook is the oracle, never a golden
  # number (a pinned 100 is just a copy of what the rules compute: it breaks on every rate edit and can
  # never catch the system drifting from the rules). checks/rating-acceptance.feature does this over
  # every saved scenario; here it is one row, inline.
  Scenario: price a quote (the REST front door to the rating engine)
    * def row = { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false }
    * def check = Rule.execute('rating', row)
    Given path 'quotes'
    And request row
    When method post
    Then status 201
    And match response contains check.output
    * check.verify(true, 'live /quotes matches the rulebook')

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
