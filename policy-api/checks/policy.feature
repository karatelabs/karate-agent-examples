Feature: insurance Policy API — quote → bind → claim lifecycle (REST / OpenAPI)

  # baseUrl is whatever this run was pointed at: the in-process mock (karate-config.js auto-starts
  # mock/policy-mock.feature), or the REST face in rating-server, or -DbaseUrl=<a deployed instance>. The
  # suite names its target ONCE, in the Background, and nowhere else — which is the only property that makes
  # it usable as the shared suite of a paired run (Contract.pair runs this file against both targets).
  # cancelPolicy (DELETE /policies/{id}) and getClaim (GET /claims/{id}) are left as the worklist
  # Coverage.gaps() shows.

  Background:
    * url baseUrl
    # SETUP THROUGH THE API, and it doubles as the precondition probe: a paired run compares what the two
    # targets answered here before it compares anything under test, so "both legs started equivalent" is
    # something it OBSERVED rather than something the run assumed.
    Given path 'policies'
    When method get
    Then status 200

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

  # BOUND FROM A REAL QUOTE, not a fabricated id: a policy carries the price of the quote it was bound
  # from, so a bind against `q-123` can only be honoured by a backend that invents one. Chaining is what
  # lets the two targets of a paired run agree about the premium on a policy at all.
  Scenario: bind a policy from a quote
    Given path 'quotes'
    And request { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    * def quote = response
    Given path 'policies'
    And request { quoteId: '#(quote.id)', holder: 'Ada Lovelace' }
    When method post
    Then status 201
    And match response.status == 'BOUND'
    And match response.monthlyPremium == quote.monthlyPremium

  # CHAINED, not a single-shot smoke: `match response == '#array'` passes against a backend that stores
  # nothing, so it cannot tell a working list endpoint from a hardcoded []. A paired run reported exactly
  # that as an unassertedDivergence — both legs green, different bodies — and the owner of that finding is
  # this file, not either target.
  Scenario: bind a policy, then read it back off the list
    Given path 'quotes'
    And request { state: 'CA', coverage: 'COMPREHENSIVE', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    * def quote = response
    Given path 'policies'
    And request { quoteId: '#(quote.id)', holder: 'Grace Hopper' }
    When method post
    Then status 201
    Given path 'policies'
    When method get
    Then status 200
    And match response == '#array'
    And match response[*].holder contains 'Grace Hopper'

  # the error PATH earns a body contract too — a status code alone leaves the shape unpinned
  Scenario: fetch a missing policy is a 404
    Given path 'policies', 'does-not-exist'
    When method get
    Then status 404
    And match response contains { error: '#string' }

  # THE REJECTIONS ARE PART OF THE CONTRACT, and a paired run only compares what the suite sends — so a
  # suite of happy paths certifies a mock over happy paths and says nothing about the rest. These three
  # rows exist because the mock and the real implementation once disagreed on every one of them.
  Scenario Outline: a rating input the rate book cannot price is refused — <case>
    Given path 'quotes'
    And request <body>
    When method post
    Then status 400
    And match response == { error: '#string', field: '<field>' }

    Examples:
      | case                    | field       | body                                                                    |
      | a territory we cannot rate | state     | { state: 'ZZ', coverage: 'COLLISION', driverAge: 40 }                   |
      | a coverage line we do not sell | coverage | { state: 'CA', coverage: 'MARINE', driverAge: 40 }                 |
      | an age outside the book | driverAge   | { state: 'CA', coverage: 'COLLISION', driverAge: 17 }                   |
      | an age sent as a string | driverAge   | { state: 'CA', coverage: 'COLLISION', driverAge: '40' }                 |
      | a flag sent as a string | priorClaims | { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: 'true' } |

  # a quote id nobody issued cannot be bound at an invented premium — the 400 the contract declares
  Scenario: binding a quote that does not exist is refused
    Given path 'policies'
    And request { quoteId: 'q-does-not-exist', holder: 'Ada Lovelace' }
    When method post
    Then status 400
    And match response == { error: '#string', field: 'quoteId' }

  Scenario: a claim for nothing, against nothing, is refused
    Given path 'claims'
    And request { policyId: 'p-does-not-exist', amount: 0 }
    When method post
    Then status 400
    And match response == { error: '#string', field: 'amount' }

  Scenario: file a claim against a policy
    Given path 'quotes'
    And request { state: 'CA', coverage: 'LIABILITY', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    * def quote = response
    Given path 'policies'
    And request { quoteId: '#(quote.id)', holder: 'Katherine Johnson' }
    When method post
    Then status 201
    * def policy = response
    Given path 'claims'
    And request { policyId: '#(policy.id)', amount: 2500, description: 'rear-end collision' }
    When method post
    Then status 201
    And match response.status == 'OPEN'
    And match response.policyId == policy.id
