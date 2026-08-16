Feature: the payments dependency, as the checkout service actually uses it — the consumer's contract suite

  # THIS FILE IS THE CONTRACT. Not a pact file, not a schema check: an ordinary functional karate suite
  # that captures every behavior the checkout service depends on — the approve path, the decline rule,
  # read-back, refund-once. It runs three ways from one Background line:
  #   • every commit, against mock/payments-mock.feature (paymentsUrl auto-starts it) — fast, hermetic;
  #   • as BOTH legs of the paired run (contract.karate.js hands each leg its target via `paymentsUrl`),
  #     which is what proves the mock can stand in for the real provider;
  #   • against any deployed payments environment: -Dpayments.url=<there>.
  # The suite names its target ONCE, in the Background, and nowhere else — the one property that makes it
  # target-swappable, which the paired run verifies off each leg's recorded exchanges rather than assuming.
  #
  # DELIBERATELY LOOSE, in one place: nothing here asserts on `network`. The mock says 'VISA', the real
  # provider says 'visa', and this suite cannot see it — so the paired run reports it as an
  # `unassertedDivergence`, a finding about THIS FILE. That is the demo's point: the pair grades the
  # suite's own comprehensiveness, which no green build can do.

  Background:
    * url paymentsUrl

  @req=PAY-001/ac1
  Scenario: a payment within the limit is approved, and the amount echoes back exactly
    Given path 'payments'
    And request { amount: 12500, currency: 'USD', card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 201
    And match response == { id: '#string', status: 'approved', amount: 12500, currency: 'USD', network: '#string' }

  @req=PAY-001/ac2
  Scenario: a payment over the limit is declined — a decision, not an error
    Given path 'payments'
    And request { amount: 50001, currency: 'USD', card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 201
    And match response contains { status: 'declined' }

  @req=PAY-002/ac1
  Scenario: a payment reads back by the id the provider minted for it
    Given path 'payments'
    And request { amount: 900, currency: 'USD', card: { number: '5500005555555559', expiry: '01/30' } }
    When method post
    Then status 201
    * def paymentId = response.id
    Given path 'payments', paymentId
    When method get
    Then status 200
    And match response contains { id: '#(paymentId)', status: 'approved', amount: 900 }

  @req=PAY-003/ac1
  Scenario: a refund happens exactly once — the second attempt is a 409, not a second refund
    Given path 'payments'
    And request { amount: 3300, currency: 'USD', card: { number: '4000056655665556', expiry: '03/28' } }
    When method post
    Then status 201
    * def paymentId = response.id
    Given path 'payments', paymentId, 'refund'
    When method post
    Then status 201
    And match response == { id: '#string', paymentId: '#(paymentId)', status: 'refunded' }
    # the payment itself now reads as refunded
    Given path 'payments', paymentId
    When method get
    Then status 200
    And match response contains { status: 'refunded' }
    # ...and refunding again is refused the same way by both implementations
    Given path 'payments', paymentId, 'refund'
    When method post
    Then status 409

  @req=PAY-002/ac2
  Scenario: asking for a payment that does not exist is a 404 with a readable error
    Given path 'payments', 'does-not-exist'
    When method get
    Then status 404
    And match response contains { error: '#string' }

  @req=PAY-001/ac3
  Scenario: a request the contract does not describe is refused, naming the field
    Given path 'payments'
    And request { amount: 0, currency: 'USD', card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 400
    And match response contains { field: 'amount' }
