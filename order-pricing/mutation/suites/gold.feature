Feature: order-pricing — the gold suite (mutation gate corpus)

  # The corpus CEILING: schema shape locks PLUS substantive value assertions on the computed
  # outputs — markers alone cannot kill a value perturbation, so every row pins the actual
  # rulebook-derived amounts as FROZEN literals (authored from the requirements + rate book at
  # corpus-freeze time; independent by the SPEC decision procedure). Two weaknesses are SEEDED by
  # design and predicted in mutation/manifest.json: no row exercises the APAC tax rate, and no row
  # sits exactly at the approval threshold (the boundary mutant's only divergence point).
  # FROZEN — corpus edits void the gates.

  Background:
    * url baseUrl

  Scenario: baseline standard order — no discounts, US tax only
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-1', category: 'hardware', qty: 5, unitPrice: 200 }] }
    When method POST
    Then status 201
    And match response == { subtotal: '#number', discount: '#number', tax: '#number', total: '#number', approval: '#string' }
    And match response.subtotal == 1000
    And match response.discount == 0
    And match response.tax == 70
    And match response.total == 1070
    And match response.approval == 'auto-approved'

  Scenario: gold tier + upper volume tier stack, EU tax
    Given path '/orders'
    And request { customerTier: 'gold', region: 'EU', rush: false, items: [{ sku: 'SW-1', category: 'software', qty: 30, unitPrice: 100 }, { sku: 'SVC-1', category: 'service', qty: 40, unitPrice: 50 }] }
    When method POST
    Then status 201
    And match response.subtotal == 5000
    And match response.discount == 1000
    And match response.tax == 800
    And match response.total == 4800
    And match response.approval == 'auto-approved'

  Scenario: platinum rush at the discount cap routes to approval
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'US', rush: true, items: [{ sku: 'HW-2', category: 'hardware', qty: 80, unitPrice: 800 }, { sku: 'SVC-2', category: 'service', qty: 20, unitPrice: 200 }] }
    When method POST
    Then status 201
    And match response.subtotal == 68000
    And match response.discount == 17000
    And match response.tax == 3570
    And match response.total == 62220
    And match response.approval == 'needs-approval'

  Scenario: silver rush order in the lower volume tier
    Given path '/orders'
    And request { customerTier: 'silver', region: 'US', rush: true, items: [{ sku: 'SW-2', category: 'software', qty: 12, unitPrice: 100 }] }
    When method POST
    Then status 201
    And match response.subtotal == 1200
    And match response.discount == 120
    And match response.tax == 75.6
    And match response.total == 1317.6
    And match response.approval == 'auto-approved'

  Scenario: exactly at the upper volume-tier boundary (50 units)
    Given path '/orders'
    And request { customerTier: 'gold', region: 'US', rush: false, items: [{ sku: 'HW-3', category: 'hardware', qty: 50, unitPrice: 20 }] }
    When method POST
    Then status 201
    And match response.subtotal == 1000
    And match response.discount == 200
    And match response.tax == 56
    And match response.total == 856
    And match response.approval == 'auto-approved'
