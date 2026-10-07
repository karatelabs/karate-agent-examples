Feature: order-pricing — the all-echo suite (mutation gate corpus)

  # The NON-CIRCULARITY control: every assertion is a whole-response literal COPIED from the
  # baseline run's observed responses and frozen (the ISSTA failure shape — asserting what the
  # system said, not what the requirement meant). These are real regression locks, so the RAW kill
  # rate is non-trivial — but mutation/provenance.json labels this whole feature `copied-response`
  # (injected KNOWN provenance; auto-detection never claims copies are detectable in the wild), so
  # the INDEPENDENT score reads zero off the labels: known-copied literals cannot buy the headline
  # number. FROZEN — corpus edits void the gates.

  Background:
    * url baseUrl

  Scenario: echoes the standard US order response verbatim
    Given path '/orders'
    And request { customerTier: 'standard', region: 'US', rush: false, items: [{ sku: 'HW-1', category: 'hardware', qty: 5, unitPrice: 200 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 1000, discount: 0, tax: 70, total: 1070, approval: 'auto-approved' }

  Scenario: echoes the gold EU volume order response verbatim
    Given path '/orders'
    And request { customerTier: 'gold', region: 'EU', rush: false, items: [{ sku: 'SW-1', category: 'software', qty: 30, unitPrice: 100 }, { sku: 'SVC-1', category: 'service', qty: 40, unitPrice: 50 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 5000, discount: 1000, tax: 800, total: 4800, approval: 'auto-approved' }

  Scenario: echoes the silver rush order response verbatim
    Given path '/orders'
    And request { customerTier: 'silver', region: 'US', rush: true, items: [{ sku: 'SW-2', category: 'software', qty: 12, unitPrice: 100 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 1200, discount: 120, tax: 75.6, total: 1317.6, approval: 'auto-approved' }

  Scenario: echoes the platinum rush large order response verbatim
    Given path '/orders'
    And request { customerTier: 'platinum', region: 'US', rush: true, items: [{ sku: 'HW-2', category: 'hardware', qty: 80, unitPrice: 800 }, { sku: 'SVC-2', category: 'service', qty: 20, unitPrice: 200 }] }
    When method POST
    Then status 201
    And match response == { subtotal: 68000, discount: 17000, tax: 3570, total: 62220, approval: 'needs-approval' }
