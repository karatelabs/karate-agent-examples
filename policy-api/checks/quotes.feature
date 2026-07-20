Feature: auto quotes — the covering-array dimension demo (REST front door to the rating engine)

  # Six quotes across coverage × state × priorClaims. MARGINALLY this looks fully exercised — every
  # coverage, every state, both prior-claims values appear at least once (each axis 100%). Yet only 6 of
  # the 3×5×2 = 30 input COMBINATIONS are tested. The cross/point view surfaces the gap; the covering-array
  # deck answers it with the MINIMAL pairwise set of cells to test next. This is the Clip 1 screenshot.

  # Every row is still oracled by the rulebook — a combination the covering array tells you to test is
  # worth testing only if something checks the answer. `Rule.execute` prices the same input the API was
  # given, so no premium is ever pinned in this file (see checks/rating-acceptance.feature for the
  # saved-scenario spine; this one exists to spread the INPUT SPACE, not to enumerate business cases).

  Background:
    * url baseUrl

  Scenario Outline: quote a <coverage> policy in <state> (priorClaims=<priorClaims>)
    * def row = { state: '<state>', coverage: '<coverage>', driverAge: 40, priorClaims: <priorClaims> }
    * def check = Rule.execute('rating', row)
    Given path 'quotes'
    And request row
    When method post
    Then status 201
    And match response contains check.output

    Examples:
      | coverage      | state | priorClaims |
      | COLLISION     | CA    | false       |
      | COMPREHENSIVE | NY    | true        |
      | LIABILITY     | TX    | false       |
      | COLLISION     | FL    | true        |
      | COMPREHENSIVE | WA    | false       |
      | LIABILITY     | CA    | true        |
