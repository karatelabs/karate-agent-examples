Feature: fleetquote — the echo suite (mutation gate corpus)

  # The NON-CIRCULARITY control: every assertion is a whole-quote literal COPIED from the baseline
  # run's observed responses and frozen (the ISSTA failure shape — asserting what the system said,
  # not what the requirement meant). These are real regression locks, so the RAW kill rate is
  # non-trivial — but mutation/provenance.json labels this whole feature `copied-response` (injected
  # KNOWN provenance; auto-detection never claims copies are detectable in the wild), so the
  # INDEPENDENT score reads zero off the label. The observation date is fixed first, so the copied
  # ratingDate is a literal like every other field. FROZEN — corpus edits void the gate.

  Background:
    * url baseUrl
    Given path 'clock'
    And request { today: '2026-03-02' }
    When method post
    Then status 200

  Scenario: echoes the urban mixed fleet quote verbatim
    Given path 'quotes'
    And request { territory: 'urban', vans: 2, lightTrucks: 2, heavyTrucks: 2, avgExperience: 4, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response == { id: 'Q-100001', status: 'rated', submission: { territory: 'urban', vans: 2, lightTrucks: 2, heavyTrucks: 2, avgExperience: 4, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false }, premium: 6694, reason: null, ratingDate: '2026-03-02', policyNumber: null }

  Scenario: echoes the rural claims-capped fleet quote verbatim
    Given path 'quotes'
    And request { territory: 'rural', vans: 4, lightTrucks: 3, heavyTrucks: 3, avgExperience: 12, safetyProgram: false, claimsCount: 4, hazmatCargo: true, youngestDriverAge: 45, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response == { id: 'Q-100002', status: 'rated', submission: { territory: 'rural', vans: 4, lightTrucks: 3, heavyTrucks: 3, avgExperience: 12, safetyProgram: false, claimsCount: 4, hazmatCargo: true, youngestDriverAge: 45, outOfStateOperations: false }, premium: 8357.71, reason: null, ratingDate: '2026-03-02', policyNumber: null }

  Scenario: echoes the referred heavy suburban fleet quote verbatim
    Given path 'quotes'
    And request { territory: 'suburban', vans: 5, lightTrucks: 0, heavyTrucks: 25, avgExperience: 8, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 50, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response == { id: 'Q-100003', status: 'referred', submission: { territory: 'suburban', vans: 5, lightTrucks: 0, heavyTrucks: 25, avgExperience: 8, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 50, outOfStateOperations: false }, premium: 30527, reason: null, ratingDate: '2026-03-02', policyNumber: null }

  Scenario: echoes the declined young-driver quote verbatim
    Given path 'quotes'
    And request { territory: 'suburban', vans: 2, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 23, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response == { id: 'Q-100004', status: 'declined', submission: { territory: 'suburban', vans: 2, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 23, outOfStateOperations: false }, premium: null, reason: 'youngest listed driver aged 23 or younger', ratingDate: null, policyNumber: null }
