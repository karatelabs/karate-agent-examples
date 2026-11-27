Feature: /claims - file and track claims

  Background:
    * url baseUrl
    * def schemas = call read('common/schemas.js')
    * def bound = call read('common/bind-policy.feature')
    * def policyId = bound.policy.id

  Scenario: file a claim against a bound policy
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 1500, description: 'rear-ended at a stop light' }
    When method post
    Then status 201
    And match header Content-Type contains 'application/json'
    And match response == schemas.claim
    And match response contains { policyId: '#(policyId)', amount: 1500, status: 'OPEN' }

  Scenario: description is optional and the minimum amount of 1 is accepted
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 1 }
    When method post
    Then status 201
    And match response contains { policyId: '#(policyId)', amount: 1, status: 'OPEN' }

  Scenario: a filed claim can be fetched by id
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 250 }
    When method post
    Then status 201
    * def claim = response

    Given path 'claims', claim.id
    When method get
    Then status 200
    And match response == schemas.claim
    And match response == claim

  Scenario: multiple claims on one policy get distinct ids
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 100 }
    When method post
    Then status 201
    * def first = response.id
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 200 }
    When method post
    Then status 201
    And match response.id != first

  Scenario: a claim can be filed against a cancelled policy
    # the server only checks that the policy exists, not its status
    Given path 'policies', policyId
    When method delete
    Then status 204
    Given path 'claims'
    And request { policyId: '#(policyId)', amount: 300 }
    When method post
    Then status 201
    And match response.status == 'OPEN'

  Scenario: get an unknown claim returns 404
    Given path 'claims', 'c-does-not-exist'
    When method get
    Then status 404
    And match response == schemas.error404
    And match response.id == 'c-does-not-exist'

  Scenario Outline: invalid claim requests are rejected with 400 - <case>
    Given path 'claims'
    And request <body>
    When method post
    Then status 400
    And match response == schemas.error400
    And match response.field == '<field>'

    Examples:
      | case               | body                                           | field    |
      | missing policyId   | { amount: 100 }                                | policyId |
      | unknown policyId   | { policyId: 'p-unknown', amount: 100 }         | policyId |
      | numeric policyId   | { policyId: 7, amount: 100 }                   | policyId |
      | missing amount     | { policyId: '#(policyId)' }                    | amount   |
      | zero amount        | { policyId: '#(policyId)', amount: 0 }         | amount   |
      | negative amount    | { policyId: '#(policyId)', amount: -5 }        | amount   |
      | fractional amount  | { policyId: '#(policyId)', amount: 10.5 }      | amount   |
      | string amount      | { policyId: '#(policyId)', amount: '100' }     | amount   |
      | empty object       | {}                                             | policyId |
