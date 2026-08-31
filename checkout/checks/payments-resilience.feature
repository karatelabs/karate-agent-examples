@resilience
Feature: checkout under a MISBEHAVING payments dependency — the fault-feed lane

  # The same mock the paired run proves faithful (contract.karate.js) now deliberately misbehaves:
  # resilience.karate.js serves it with the frozen fault deck (mutation/fault-manifest.json), and each
  # scenario below ARMS one fault over the mock's own control endpoint, drives the REAL checkout service
  # through it, and judges the consumer. The verdicts are AUTHORED — each assertion is this team's
  # statement of what resilient looks like, so a fault checkout tolerates is a PASS, and a red here is a
  # finding about checkout itself: a way this service mishandles a dependency it cannot control. No
  # recorded pact can express any of this — a pact file has no fault deck, and BDCT never executes the
  # consumer at all. (Polarity law — this lane never enters any mutation
  # score, and its runs are instrument runs, kept out of runs/.)
  #
  # TWO of the four scenarios are DELIBERATE findings (see the README) — this suite is expected red:
  #   - "a stalled provider": checkout's payments client has no timeout, so checkout hangs as long as
  #     the dependency stalls — the two-second budget is breached.
  #   - "an answer missing the payment id": checkout records a CONFIRMED order with paymentId null —
  #     an order it can never tie to a payment.
  # Arming REPLACES (one fault at a time), so scenarios must run sequentially (threads: 1).

  Background:
    * url checkoutUrl

  @req=CHK-003/ac1
  Scenario: a payments 500 is refused honestly — the order is not placed, and the reason says why
    Given url paymentsUrl
    And path '__karate/fault'
    And request { id: 'payments-500' }
    When method post
    Then status 200
    Given url checkoutUrl
    And path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 1, priceCents: 1900 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 502
    And match response.error contains 'order not placed'

  @req=CHK-003/ac2
  Scenario: a payments connection that dies mid-request is refused honestly, not lost
    Given url paymentsUrl
    And path '__karate/fault'
    And request { id: 'payments-dead' }
    When method post
    Then status 200
    Given url checkoutUrl
    And path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 1, priceCents: 1900 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then status 502
    And match response.error contains 'could not reach the payments provider'

  @req=CHK-003/ac3
  Scenario: a stalled payments provider must not stall checkout past its two-second budget
    # DELIBERATE FINDING — expected RED: CheckoutServer's HttpClient sets no request timeout, so a
    # dependency stalling 2.5s stalls every order that long (and a dependency that never answers would
    # hang checkout forever). The fix belongs in the consumer: a client timeout below the budget, and a
    # 502 when it trips. No pact-style artifact could even express this case.
    Given url paymentsUrl
    And path '__karate/fault'
    And request { id: 'payments-stall' }
    When method post
    Then status 200
    Given url checkoutUrl
    And path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 1, priceCents: 1900 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    Then assert responseTime < 2000

  @req=CHK-003/ac4
  Scenario: an approval missing its payment id must never become a CONFIRMED order with no payment reference
    # DELIBERATE FINDING — expected RED: the provider answers 201 but the `id` field is gone, and
    # checkout records the order as CONFIRMED with paymentId null — an order it can never reconcile,
    # refund, or audit. Refusing the order (502) or recording it unconfirmed would both pass here;
    # confirming without a payment reference is the one outcome this team rules out.
    Given url paymentsUrl
    And path '__karate/fault'
    And request { id: 'payment-id-dropped' }
    When method post
    Then status 200
    Given url checkoutUrl
    And path 'orders'
    And request { items: [ { sku: 'kar-tee', qty: 1, priceCents: 1900 } ], card: { number: '4242424242424242', expiry: '12/29' } }
    When method post
    * def confirmedWithoutPayment = responseStatus == 201 && response.status == 'CONFIRMED' && response.paymentId == null
    Then assert !confirmedWithoutPayment
