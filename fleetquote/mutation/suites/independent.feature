Feature: fleetquote — the independent rating suite (mutation gate corpus)

  # The corpus CEILING for the STATEFUL subject: every expectation is a literal derived BY HAND from
  # requirements/fleet-auto.md + SOT-prose.md section 4 and the rate book in rulebooks/rating/calc.js,
  # then frozen. Nothing here is recomputed through Rule.execute and nothing is copied from a response,
  # so a kill here is independent by the mutation-testing design's decision procedure. Every rule branch
  # the requirements name is exercised, and the rows sit ON the boundaries they state (7 vehicles, 2 and
  # 8 years, age 23, the 60% surcharge cap, the $390 floor, the $29,000 referral line).
  # FROZEN — corpus edits void the gate.

  Background:
    * url baseUrl

  Scenario: urban mixed fleet, mid-band experience, no credits (FLEET-003, FLEET-004/3, FLEET-009/2)
    # 2 x 610 x 1.25 = 1525, 2 x 780 x 1.15 = 1794, 2 x 1250 x 1.35 = 3375 -> 6694; no adjustment,
    # 6 vehicles earn no fleet-size discount, no safety program, no claims
    Given path 'quotes'
    And request { territory: 'urban', vans: 2, lightTrucks: 2, heavyTrucks: 2, avgExperience: 4, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'rated'
    And match response.premium == 6694
    And match response.reason == null

  Scenario: suburban fleet of exactly 7, new drivers, safety program, one claim (FLEET-004/1, FLEET-005/3, FLEET-006/1)
    # 3 x 610 x 1 = 1830, 2 x 780 x 0.95 = 1482, 2 x 1250 x 1 = 2500 -> 5812; x 1.15 = 6683.80;
    # 11% + 15% stacked = 26% -> 4946.012; surcharge 17% of 6683.80 = 1136.246; 6082.258 -> 6082.26
    Given path 'quotes'
    And request { territory: 'suburban', vans: 3, lightTrucks: 2, heavyTrucks: 2, avgExperience: 2, safetyProgram: true, claimsCount: 1, hazmatCargo: false, youngestDriverAge: 35, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'rated'
    And match response.premium == 6082.26
    And match response.reason == null

  Scenario: rural fleet, seasoned drivers, four claims hit the surcharge cap (FLEET-004/2, FLEET-006/2)
    # 4 x 610 x 0.8 = 1952, 3 x 780 x 0.8 = 1872, 3 x 1250 x 0.85 = 3187.50 -> 7011.50; x 0.8 = 5609.20;
    # 11% -> 4992.188; raw surcharge 68% capped at 60% of 5609.20 = 3365.52; 8357.708 -> 8357.71
    Given path 'quotes'
    And request { territory: 'rural', vans: 4, lightTrucks: 3, heavyTrucks: 3, avgExperience: 12, safetyProgram: false, claimsCount: 4, hazmatCargo: true, youngestDriverAge: 45, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'rated'
    And match response.premium == 8357.71
    And match response.reason == null

  Scenario: heavy suburban fleet at 8 years experience is referred to underwriting (FLEET-009/1)
    # 5 x 610 x 1 = 3050, 25 x 1250 x 1 = 31250 -> 34300; 8 years is not "more than 8", no adjustment;
    # 30 vehicles -> 11% -> 30527, which exceeds the $29,000 referral line
    Given path 'quotes'
    And request { territory: 'suburban', vans: 5, lightTrucks: 0, heavyTrucks: 25, avgExperience: 8, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 50, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'referred'
    And match response.premium == 30527
    And match response.reason == null

  Scenario: a single rural van below the minimum premium is raised to it (FLEET-007/1)
    # 610 x 0.8 = 488; x 0.8 seasoned = 390.40; 15% safety credit -> 331.84, below $390 -> raised to 390
    Given path 'quotes'
    And request { territory: 'rural', vans: 1, lightTrucks: 0, heavyTrucks: 0, avgExperience: 12, safetyProgram: true, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 50, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'rated'
    And match response.premium == 390
    And match response.reason == null

  Scenario: a youngest listed driver of exactly 23 is declined (FLEET-002/1, FLEET-002/3)
    Given path 'quotes'
    And request { territory: 'suburban', vans: 2, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 23, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'declined'
    And match response.premium == null
    And match response.reason == 'youngest listed driver aged 23 or younger'

  Scenario: regular out-of-state operations are declined on their own reason (FLEET-002/2, FLEET-002/4)
    Given path 'quotes'
    And request { territory: 'urban', vans: 3, lightTrucks: 1, heavyTrucks: 0, avgExperience: 6, safetyProgram: true, claimsCount: 2, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: true }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
    And match response.status == 'declined'
    And match response.premium == null
    And match response.reason == 'regular out-of-state operations'
