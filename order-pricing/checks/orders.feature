Feature: order-pricing quotes — the cross/point dimension demo

  # Three orders across distinct customerTier x region pairs. Marginally this looks healthy
  # (every region exercised, 3 of 4 tiers), yet only 3 of the 12 tier x region COMBINATIONS are
  # tested — exactly the gap the cross/point projection surfaces that a path+method view misses.

  Background:
    * url baseUrl

  Scenario Outline: quote for a <tier> customer in <region>
    Given path '/orders'
    And request { customerTier: '<tier>', region: '<region>', rush: false, items: [{ sku: 'SKU-1', category: 'hardware', qty: 1, unitPrice: 100 }] }
    When method POST
    Then status 201
    And match response.total == '#number'

    Examples:
      | tier     | region |
      | standard | US     |
      | gold     | EU     |
      | platinum | APAC   |
