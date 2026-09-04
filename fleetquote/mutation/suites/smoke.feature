Feature: fleetquote — status-only smoke (mutation gate corpus)

  # The corpus FLOOR: the fleet is submitted and rated, the status codes come back, nothing about the
  # quote body is checked. Mutation testing exists to make this suite's emptiness measurable — the
  # bottom of the discrimination ladder (status-only < echo < independent). The one thing it CAN
  # notice is a rulebook that stops answering at all. FROZEN — corpus edits void the gate.

  Background:
    * url baseUrl

  Scenario: an urban mixed fleet is submitted and rated
    Given path 'quotes'
    And request { territory: 'urban', vans: 2, lightTrucks: 2, heavyTrucks: 2, avgExperience: 4, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 40, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200

  Scenario: a rural fleet with claims is submitted and rated
    Given path 'quotes'
    And request { territory: 'rural', vans: 4, lightTrucks: 3, heavyTrucks: 3, avgExperience: 12, safetyProgram: false, claimsCount: 4, hazmatCargo: true, youngestDriverAge: 45, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200

  Scenario: a heavy suburban fleet is submitted and rated
    Given path 'quotes'
    And request { territory: 'suburban', vans: 5, lightTrucks: 0, heavyTrucks: 25, avgExperience: 8, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 50, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200

  Scenario: a fleet with a young driver is submitted and rated
    Given path 'quotes'
    And request { territory: 'suburban', vans: 2, lightTrucks: 0, heavyTrucks: 0, avgExperience: 5, safetyProgram: false, claimsCount: 0, hazmatCargo: false, youngestDriverAge: 23, outOfStateOperations: false }
    When method post
    Then status 201
    * def id = response.id

    Given path 'quotes', id, 'rate'
    When method post
    Then status 200
