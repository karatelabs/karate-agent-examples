@e2e
Feature: checkout — the consumer SUT, end to end through its payments dependency

  # These checks drive the REAL checkout service (a Java app — the README's e2e lane starts it), which calls the
  # payments API to do its work. Day to day that dependency is mock/payments-mock.feature — full speed,
  # no external service — and contract.karate.js is the license for that arrangement: the paired run
  # proves the mock faithful, so what passes here against the mock means something about production.
  #
  # Tagged @e2e because it needs the SUT process: start the two servers first (README), then select this lane with
  # -Dcheckout.url=http://localhost:8080 (suite.karate.js wires both). Without the property the lane is
  # selected out rather than failed.

  Background:
    * url checkoutUrl

  @req=CHK-001/ac1
  Scenario: an order whose payment is approved is CONFIRMED, and carries its payment reference
    Given path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 2, priceCents: 1900 }, { sku: 'kar-mug', qty: 1, priceCents: 1200 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 201
    And match response == { id: '#string', status: 'CONFIRMED', totalCents: 5000, paymentId: '#string' }
    * def orderId = response.id
    Given path 'orders', orderId
    When method get
    Then status 200
    And match response contains { id: '#(orderId)', status: 'CONFIRMED' }

  @req=CHK-002/ac1
  Scenario: a declined payment is a recorded outcome, never a lost order
    Given path 'orders'
    And request { items: [ { sku: 'kar-server-rack', qty: 1, priceCents: 99900 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 201
    And match response contains { status: 'PAYMENT_DECLINED', paymentId: '#string' }

  @req=CHK-001/ac2
  Scenario: an order the payments provider refuses outright is refused here too, with the reason
    Given path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 1, priceCents: 1900 } ], card: { number: '' } }
    When method post
    Then status 400
    And match response.error contains 'payments provider refused'
