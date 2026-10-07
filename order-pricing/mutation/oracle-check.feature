Feature: order-pricing — the oracle-verified face-split instrument

  # NOT a corpus suite — the face-split PROOF instrument (the freeze-one-face
  # law): this check recomputes the expectation through Rule.execute against the PROJECT rulebook
  # (the frozen oracle face) and stamps verify() against the served response (the mock face).
  # Against baseline both faces agree (green by construction); against a SERVED MUTANT they
  # disagree while the project's calc.js stays byte-identical — the verify() failure IS the proof
  # the two faces split. A verify() kill is a disclosed NON-independent raw kill:
  # recomputation can never buy the headline score.

  Background:
    * url baseUrl

  Scenario: the served pricing agrees with the rulebook oracle
    * def input = { customerTier: 'gold', region: 'EU', rush: true, items: [{ sku: 'SW-1', category: 'software', qty: 15, unitPrice: 120 }] }
    Given path '/orders'
    And request input
    When method POST
    Then status 201
    * def oracle = Rule.execute('order-pricing', input)
    * oracle.verify(response.total == oracle.output.total, 'served total agrees with the rulebook oracle')
