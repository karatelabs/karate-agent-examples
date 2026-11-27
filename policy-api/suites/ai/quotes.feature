Feature: POST /quotes - price a coverage request

  Background:
    * url baseUrl
    * path 'quotes'
    * def schemas = call read('common/schemas.js')

  Scenario: a valid request returns a priced quote matching the Quote schema
    Given request { state: 'CA', coverage: 'LIABILITY', driverAge: 40, priorClaims: false }
    When method post
    Then status 201
    And match header Content-Type contains 'application/json'
    And match response == schemas.quote
    And match response contains { policyClass: 'PREFERRED', monthlyPremium: 60, currency: 'USD' }

  Scenario: each quote gets a distinct id
    Given request { state: 'TX', coverage: 'LIABILITY', driverAge: 40 }
    When method post
    Then status 201
    * def first = response.id
    Given path 'quotes'
    And request { state: 'TX', coverage: 'LIABILITY', driverAge: 40 }
    When method post
    Then status 201
    And match response.id != first

  # premium = coverage base (LIABILITY 50, COLLISION 90, COMPREHENSIVE 140)
  #         + 40 if driverAge < 25 + 35 if priorClaims
  #         + state factor (NY/FL 15, CA 10, TX/WA 0)
  # class   = SUBSTANDARD if priorClaims, else PREFERRED for 25..70, else STANDARD
  Scenario Outline: rating - <state> <coverage> age <driverAge> priorClaims <priorClaims>
    Given request { state: '<state>', coverage: '<coverage>', driverAge: <driverAge>, priorClaims: <priorClaims> }
    When method post
    Then status 201
    And match response == schemas.quote
    And match response.monthlyPremium == <premium>
    And match response.policyClass == '<policyClass>'

    Examples:
      | state | coverage      | driverAge | priorClaims | premium | policyClass |
      | CA    | LIABILITY     | 40        | false       | 60      | PREFERRED   |
      | NY    | LIABILITY     | 40        | false       | 65      | PREFERRED   |
      | FL    | LIABILITY     | 40        | false       | 65      | PREFERRED   |
      | TX    | LIABILITY     | 40        | false       | 50      | PREFERRED   |
      | WA    | LIABILITY     | 40        | false       | 50      | PREFERRED   |
      | TX    | COLLISION     | 40        | false       | 90      | PREFERRED   |
      | TX    | COMPREHENSIVE | 40        | false       | 140     | PREFERRED   |
      | TX    | LIABILITY     | 18        | false       | 90      | STANDARD    |
      | TX    | LIABILITY     | 24        | false       | 90      | STANDARD    |
      | TX    | LIABILITY     | 25        | false       | 50      | PREFERRED   |
      | TX    | LIABILITY     | 70        | false       | 50      | PREFERRED   |
      | TX    | LIABILITY     | 71        | false       | 50      | STANDARD    |
      | TX    | LIABILITY     | 80        | false       | 50      | STANDARD    |
      | TX    | LIABILITY     | 40        | true        | 85      | SUBSTANDARD |
      | NY    | COMPREHENSIVE | 20        | true        | 230     | SUBSTANDARD |
      | CA    | COLLISION     | 75        | true        | 135     | SUBSTANDARD |

  Scenario: priorClaims defaults to false when omitted
    Given request { state: 'FL', coverage: 'COLLISION', driverAge: 30 }
    When method post
    Then status 201
    And match response contains { policyClass: 'PREFERRED', monthlyPremium: 105 }

  Scenario Outline: invalid rating inputs are rejected with 400 - <case>
    Given request <body>
    When method post
    Then status 400
    And match response == schemas.error400
    And match response.field == '<field>'

    Examples:
      | case                      | body                                                                          | field       |
      | missing state             | { coverage: 'LIABILITY', driverAge: 40 }                                      | state       |
      | unrated state             | { state: 'ZZ', coverage: 'LIABILITY', driverAge: 40 }                         | state       |
      | lower-case state          | { state: 'ca', coverage: 'LIABILITY', driverAge: 40 }                         | state       |
      | non-string state          | { state: 12, coverage: 'LIABILITY', driverAge: 40 }                           | state       |
      | missing coverage          | { state: 'CA', driverAge: 40 }                                                | coverage    |
      | unknown coverage          | { state: 'CA', coverage: 'FLOOD', driverAge: 40 }                             | coverage    |
      | missing driverAge         | { state: 'CA', coverage: 'LIABILITY' }                                        | driverAge   |
      | driverAge below minimum   | { state: 'CA', coverage: 'LIABILITY', driverAge: 17 }                         | driverAge   |
      | driverAge above maximum   | { state: 'CA', coverage: 'LIABILITY', driverAge: 81 }                         | driverAge   |
      | driverAge as string       | { state: 'CA', coverage: 'LIABILITY', driverAge: '40' }                       | driverAge   |
      | driverAge fractional      | { state: 'CA', coverage: 'LIABILITY', driverAge: 40.5 }                       | driverAge   |
      | priorClaims as string     | { state: 'CA', coverage: 'LIABILITY', driverAge: 40, priorClaims: 'true' }    | priorClaims |
      | empty object              | {}                                                                            | state       |
