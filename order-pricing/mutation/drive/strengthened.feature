# The closed-loop drive artifact (the mutation gate's closed-loop + UX exits):
# a COLD subagent, blinded (no gold suite, no manifest, no provenance staged), was handed the
# representative suite as a working copy and the self-describing Rule.mutate surface, and
# strengthened it to independentScore 1.0 in ONE counted JSAPI call (budget 10; the logging
# wrapper was the call-count authority; suite edits uncounted per the gate). This file is that
# drive's measured OUTPUT — evidence, not corpus: deliberately NOT in frozenArtifacts, and the
# frozen representative.feature baseline it strengthened is untouched. Re-scoring this file
# reproduces the recorded result.
Feature: Order creation API tests

  # Strengthened for the mutation drive: every scenario pins the FULL computed response with frozen
  # literals derived by hand from the pricing requirements and rate book (subtotal, discount, tax,
  # total, approval), plus boundary scenarios on the volume tiers (qty 9/10/49/50), the discount
  # cap (0.25 stacked rate), each region tax, the rush surcharge, and the 50000 approval threshold
  # (exactly at, just above, and well above).

  Background:
    * url baseUrl

  Scenario: Create a simple order returns pricing breakdown
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 1, unitPrice: 50.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 50.0, discount: 0.0, tax: 3.5, total: 53.5, approval: 'auto-approved' }

  Scenario: Small order with no volume discount
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'SW-200', category: 'software', qty: 2, unitPrice: 10.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 20.0, discount: 0.0, tax: 1.4, total: 21.4, approval: 'auto-approved' }

  Scenario: Large quantity order applies a volume discount (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 100, unitPrice: 5.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 500.0, discount: 50.0, tax: 31.5, total: 481.5, approval: 'auto-approved' }

  Scenario: Rush order includes surcharge and costs more than non-rush (ORD-PRICE-002)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'SV-300', category: 'service', qty: 1, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 100.0, discount: 0.0, tax: 7.0, total: 107.0, approval: 'auto-approved' }
    * def normalTotal = response.total
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: true, items: [{ sku: 'SV-300', category: 'service', qty: 1, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 100.0, discount: 0.0, tax: 7.0, total: 122.0, approval: 'auto-approved' }
    * assert response.total > normalTotal

  Scenario: Low-value order is auto-approved (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'silver', region: 'EU', rush: false, items: [{ sku: 'SW-201', category: 'software', qty: 1, unitPrice: 5.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 5.0, discount: 0.25, tax: 0.95, total: 5.7, approval: 'auto-approved' }

  Scenario: High-value order requires manual approval (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-999', category: 'hardware', qty: 50, unitPrice: 10000.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 500000.0, discount: 50000.0, tax: 31500.0, total: 481500.0, approval: 'needs-approval' }

  Scenario: Gold tier order returns valid pricing shape
    Given path '/orders'
    And request { customerTier: 'gold', region: 'APAC', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 3, unitPrice: 25.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 75.0, discount: 7.5, tax: 6.75, total: 74.25, approval: 'auto-approved' }

  Scenario: Multi-item order sums subtotal across items
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'EU', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 2, unitPrice: 30.0 }, { sku: 'SW-200', category: 'software', qty: 1, unitPrice: 40.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 100.0, discount: 15.0, tax: 17.0, total: 102.0, approval: 'auto-approved' }

  Scenario: Volume tier-2 boundary, exactly 10 units earns 5 percent (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 10, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 1000.0, discount: 50.0, tax: 66.5, total: 1016.5, approval: 'auto-approved' }

  Scenario: Just below volume tier-2, 9 units earns no discount (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 9, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 900.0, discount: 0.0, tax: 63.0, total: 963.0, approval: 'auto-approved' }

  Scenario: Volume tier-1 boundary, exactly 50 units earns 10 percent (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 50, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 5000.0, discount: 500.0, tax: 315.0, total: 4815.0, approval: 'auto-approved' }

  Scenario: Just below volume tier-1, 49 units earns only 5 percent (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 49, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 4900.0, discount: 245.0, tax: 325.85, total: 4980.85, approval: 'auto-approved' }

  Scenario: Platinum plus volume stacks to the 25 percent cap boundary
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 50, unitPrice: 100.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 5000.0, discount: 1250.0, tax: 262.5, total: 4012.5, approval: 'auto-approved' }

  Scenario: Total exactly at the 50000 threshold auto-approves (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'APAC', rush: true, items: [{ sku: 'HW-500', category: 'hardware', qty: 1, unitPrice: 40000.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 40000.0, discount: 0.0, tax: 4000.0, total: 50000.0, approval: 'auto-approved' }

  Scenario: Total just above the 50000 threshold needs approval (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'APAC', rush: true, items: [{ sku: 'HW-500', category: 'hardware', qty: 1, unitPrice: 40000.08 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 40000.08, discount: 0.0, tax: 4000.01, total: 50000.1, approval: 'needs-approval' }

  Scenario: Total of 60000 needs approval (ORD-PRICE-003)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'APAC', rush: true, items: [{ sku: 'HW-500', category: 'hardware', qty: 1, unitPrice: 48000.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 48000.0, discount: 0.0, tax: 4800.0, total: 60000.0, approval: 'needs-approval' }

  Scenario: Volume discount keys on summed quantity across lines (ORD-PRICE-001)
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-100', category: 'hardware', qty: 30, unitPrice: 10.0 }, { sku: 'SW-200', category: 'software', qty: 25, unitPrice: 20.0 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 800.0, discount: 80.0, tax: 50.4, total: 770.4, approval: 'auto-approved' }
