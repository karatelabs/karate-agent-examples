Feature: order-pricing — status-only smoke (mutation gate corpus)

  # The corpus FLOOR: the classic scaffold shape — the request goes out, the status comes back,
  # nothing about the response body is checked. Mutation testing exists to make this suite's
  # emptiness measurable: its independent mutation score is the bottom of the discrimination
  # ladder (status-only < representative < gold). FROZEN — corpus edits void the gates.

  Background:
    * url baseUrl

  Scenario: a standard US order is accepted
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'SKU-1', category: 'hardware', qty: 5, unitPrice: 200 }] }
    When method POST
    Then status 201

  Scenario: a gold EU order is accepted
    Given path '/orders'
    And request { customerTier: 'gold', region: 'EU', rush: false, items: [{ sku: 'SKU-2', category: 'software', qty: 30, unitPrice: 100 }] }
    When method POST
    Then status 201

  Scenario: a platinum APAC order is accepted
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'APAC', rush: false, items: [{ sku: 'SKU-3', category: 'service', qty: 2, unitPrice: 150 }] }
    When method POST
    Then status 201
