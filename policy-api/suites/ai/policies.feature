Feature: /policies - bind, read, list and cancel policies

  # The server is a long-lived in-memory instance, so tests never assume an empty
  # store: every scenario creates its own data and looks for it by id.

  Background:
    * url baseUrl
    * def schemas = call read('common/schemas.js')

  Scenario: bind a policy from a quote - it carries the quote's price and state
    Given path 'quotes'
    And request { state: 'NY', coverage: 'COLLISION', driverAge: 22, priorClaims: false }
    When method post
    Then status 201
    * def quote = response

    Given path 'policies'
    And request { quoteId: '#(quote.id)', holder: 'Jane Doe' }
    When method post
    Then status 201
    And match header Content-Type contains 'application/json'
    And match response == schemas.policy
    And match response contains { quoteId: '#(quote.id)', holder: 'Jane Doe', state: 'NY', monthlyPremium: '#(quote.monthlyPremium)', status: 'BOUND' }
    And match response.monthlyPremium == 145

  Scenario: a bound policy can be fetched by id
    * def bound = call read('common/bind-policy.feature') { state: 'WA', coverage: 'COMPREHENSIVE', driverAge: 50 }
    Given path 'policies', bound.policy.id
    When method get
    Then status 200
    And match response == schemas.policy
    And match response == bound.policy

  Scenario: the same quote can be bound more than once, each with its own id
    * def bound = call read('common/bind-policy.feature')
    Given path 'policies'
    And request { quoteId: '#(bound.quote.id)', holder: 'Second Holder' }
    When method post
    Then status 201
    And match response.id != bound.policy.id
    And match response.quoteId == bound.quote.id

  Scenario: list policies includes a newly bound policy
    * def bound = call read('common/bind-policy.feature')
    Given path 'policies'
    When method get
    Then status 200
    And match response == '#[_ > 0]'
    And match each response == schemas.policy
    And match response contains deep bound.policy

  Scenario: list policies filtered by state returns only that state
    * def ca = call read('common/bind-policy.feature') { state: 'CA' }
    * def fl = call read('common/bind-policy.feature') { state: 'FL' }
    Given path 'policies'
    And param state = 'FL'
    When method get
    Then status 200
    And match each response contains { state: 'FL' }
    And match response contains deep fl.policy
    * def ids = karate.map(response, function(p){ return p.id })
    And match ids !contains ca.policy.id

  Scenario: list policies with a state that has no policies returns an empty array
    Given path 'policies'
    And param state = 'ZZ'
    When method get
    Then status 200
    And match response == []

  Scenario: cancel a policy - it stays readable with status CANCELLED
    * def bound = call read('common/bind-policy.feature')
    Given path 'policies', bound.policy.id
    When method delete
    Then status 204
    # 204 carries no body
    And match responseBytes == '#null'

    Given path 'policies', bound.policy.id
    When method get
    Then status 200
    And match response == schemas.policy
    And match response.status == 'CANCELLED'
    And match response contains { id: '#(bound.policy.id)', holder: '#(bound.policy.holder)' }

    Given path 'policies'
    When method get
    Then status 200
    * def mine = karate.filter(response, function(p){ return p.id == bound.policy.id })
    And match mine == '#[1]'
    And match mine[0].status == 'CANCELLED'

  Scenario: get an unknown policy returns 404
    Given path 'policies', 'p-does-not-exist'
    When method get
    Then status 404
    And match response == schemas.error404
    And match response.id == 'p-does-not-exist'

  Scenario: cancel an unknown policy returns 404
    Given path 'policies', 'p-does-not-exist'
    When method delete
    Then status 404
    And match response == schemas.error404

  Scenario Outline: invalid binding requests are rejected with 400 - <case>
    * def q = call read('common/bind-policy.feature')
    * def quoteId = q.quote.id
    Given path 'policies'
    And request <body>
    When method post
    Then status 400
    And match response == schemas.error400
    And match response.field == '<field>'

    Examples:
      | case             | body                                           | field   |
      | missing quoteId  | { holder: 'Jane' }                             | quoteId |
      | blank quoteId    | { quoteId: '', holder: 'Jane' }                | quoteId |
      | unknown quoteId  | { quoteId: 'q-unknown', holder: 'Jane' }       | quoteId |
      | missing holder   | { quoteId: '#(quoteId)' }                      | holder  |
      | blank holder     | { quoteId: '#(quoteId)', holder: '  ' }        | holder  |
      | numeric holder   | { quoteId: '#(quoteId)', holder: 42 }          | holder  |
      | empty object     | {}                                             | quoteId |
