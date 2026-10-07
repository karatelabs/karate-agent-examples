Feature: order-pricing quotes — the 3-axis covering-array demo

  # Five orders spread across customerTier x region x rush. MARGINALLY this looks fully exercised —
  # every tier, every region, both rush values appear at least once (each axis 100%). Yet only 5 of
  # the 4x3x2 = 24 input COMBINATIONS are tested. The cross/point view surfaces that gap; the
  # covering-array deck answers it with the MINIMAL pairwise set of cells to test next (far fewer
  # than the 19 untested combinations). This is the screenshot the docs/demo want.

  Background:
    * url baseUrl

  Scenario Outline: quote for a <tier> customer in <region> (rush=<rush>)
    Given path '/orders'
    And request { customerTier: '<tier>', region: '<region>', rush: <rush>, items: [{ sku: 'SKU-1', category: 'hardware', qty: 1, unitPrice: 100 }] }
    When method POST
    Then status 201
    And match response.total == '#number'

    # NB silver is US-only (the market-availability precondition in the `order-pricing-restricted` rate
    # book) — so there is no silver×EU row to write: the rules make that order impossible, and the cross
    # projection prunes it from the required set rather than reporting it as a gap.
    Examples:
      | tier     | region | rush  |
      | standard | US     | false |
      | silver   | US     | true  |
      | gold     | APAC   | false |
      | platinum | US     | true  |
      | standard | EU     | false |
