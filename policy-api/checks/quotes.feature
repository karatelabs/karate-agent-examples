Feature: auto quotes — the covering-array dimension demo (REST front door to the rating engine)

  # Six quotes across coverage × state × priorClaims. MARGINALLY this looks fully exercised — every
  # coverage, every state, both prior-claims values appear at least once (each axis 100%). Yet only 6 of
  # the 3×5×2 = 30 input COMBINATIONS are tested. The cross/point view surfaces the gap; the covering-array
  # deck answers it with the MINIMAL pairwise set of cells to test next. This is the Clip 1 screenshot.

  Background:
    * url baseUrl

  Scenario Outline: quote a <coverage> policy in <state> (priorClaims=<priorClaims>)
    Given path 'quotes'
    And request { state: '<state>', coverage: '<coverage>', driverAge: 40, priorClaims: <priorClaims> }
    When method post
    Then status 201
    And match response.monthlyPremium == '#number'
    And match response.currency == 'USD'

    Examples:
      | coverage      | state | priorClaims |
      | COLLISION     | CA    | false       |
      | COMPREHENSIVE | NY    | true        |
      | LIABILITY     | TX    | false       |
      | COLLISION     | FL    | true        |
      | COMPREHENSIVE | WA    | false       |
      | LIABILITY     | CA    | true        |
