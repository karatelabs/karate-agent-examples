Feature: Order creation API tests

  # The corpus MIDDLE rung: authored by ONE cold LLM session given ONLY the OpenAPI contract and
  # the requirements prose (never calc.js or the rate book), then FROZEN VERBATIM — the
  # representative first-pass suite an LLM actually produces: shape locks, the few literals it
  # could derive (subtotals), one def-capture comparison, one assert. Corpus edits void the
  # gates. (the cold-session provenance is the point; do not "improve" this file.)

  Background:
    * url baseUrl

  Scenario: Create a simple order returns pricing breakdown
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 1, unitPrice: 50.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: '#number', discount: '#number', tax: '#number', total: '#number', approval: '#string' }
    And match response.subtotal == 50.0

  Scenario: Small order with no volume discount
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'SW-200', category: 'software', qty: 2, unitPrice: 10.0 }] }
    When method POST
    Then status 201
    And match response.subtotal == 20.0
    And match response.discount == '#number'
    And match response.total == '#number'
    And match response.approval == 'auto-approved'

  Scenario: Large quantity order applies a volume discount (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 100, unitPrice: 5.0 }] }
    When method POST
    Then status 201
    And match response.subtotal == 500.0
    And match response.discount != 0
    And match response.total == '#number'

  Scenario: Rush order includes surcharge and costs more than non-rush (ORD-PRICE-002)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'SV-300', category: 'service', qty: 1, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    * def normalTotal = response.total
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: true, items: [{ sku: 'SV-300', category: 'service', qty: 1, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response.total == '#number'
    * assert response.total > normalTotal

  Scenario: Low-value order is auto-approved (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'silver', region: 'EU', rush: false, items: [{ sku: 'SW-201', category: 'software', qty: 1, unitPrice: 5.0 }] }
    When method POST
    Then status 201
    And match response.approval == 'auto-approved'

  Scenario: High-value order requires manual approval (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-999', category: 'hardware', qty: 50, unitPrice: 10000.0 }] }
    When method POST
    Then status 201
    And match response.approval == 'needs-approval'

  Scenario: Gold tier order returns valid pricing shape
    Given path '/orders'
    And request { customerTier: 'gold', region: 'APAC', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 3, unitPrice: 25.0 }] }
    When method POST
    Then status 201
    And match response.subtotal == 75.0
    And match response.discount == '#number'
    And match response.tax == '#number'
    And match response.total == '#number'
    And match response.approval == '#string'

  Scenario: Multi-item order sums subtotal across items
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'EU', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 2, unitPrice: 30.0 }, { sku: 'SW-200', category: 'software', qty: 1, unitPrice: 40.0 }] }
    When method POST
    Then status 201
    And match response.subtotal == 100.0
    And match response.total == '#number'
    And match response.approval == '#string'
