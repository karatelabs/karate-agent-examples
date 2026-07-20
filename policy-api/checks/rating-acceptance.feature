Feature: rating acceptance — the saved scenarios, LIVE against the /quotes API (the RTM spine)

  THE demo spine. For every saved scenario, POST a real quote to the /quotes API and assert the system
  prices it exactly as the `rating` rulebook does (Rule.execute — the oracle). Two things happen per row:
  the real HTTP call is an OBSERVED hit (a receipt the system was exercised), and Rule.execute fires the
  rulebook's calc.req — together they light each requirement the scenarios reach in the RTM as genuinely
  COVERED (a real call, not just a rule firing).
  #
  # NO hardcoded premiums: the rulebook is the source of truth, so `match response == Rule.execute` never
  # needs maintenance — a rate edit (the Lookups tab) never requires EDITING a row — and a row goes red
  # only when the SYSTEM diverges from the RULE. (Editing the rate on ONE side IS such a divergence: this
  # kit's mock carries its own pricing implementation, exactly as a real backend would, so a rate change
  # has to land on both sides. That red is the product working, not test maintenance.)
  # Point baseUrl at a real backend and it's a live contract test (the keystone).
  #
  # THE LOOP: run it → the saved scenarios cover young (RATE-001/1), prior-claims (RATE-002/1) and territory
  # (RATE-003/1), but none sends a driver over 70, so RATE-001/2 is the live gap → readiness NOT READY,
  # blocker RATE-001. Add a senior scenario (console ＋ save, or an LLM over MCP) → RE-RUN this same feature
  # → the senior row's live call covers RATE-001/2 → READY. One feature, add a row, re-run, green.

  Background:
    * url baseUrl

  Scenario Outline: <id> — <label>
    # run the saved scenario through the rulebook (the ORACLE) — this fires calc.req for the criteria this
    # row reaches (the RTM) and names the saved rule-scenario coverage item
    * def check = Rule.execute('rating', __row)
    * def oracle = check.output
    # the SYSTEM under test — a REAL call to the /quotes API (the OBSERVED receipt)
    Given path 'quotes'
    And request { state: '#(__row.state)', coverage: '#(__row.coverage)', driverAge: '#(__row.driverAge)', priorClaims: '#(__row.priorClaims)' }
    When method post
    Then status 201
    # the system must match the rule — no golden number
    And match response.monthlyPremium == oracle.monthlyPremium
    And match response.currency == oracle.currency
    # record the live-vs-rule verdict — lights this saved scenario COVERED in the rules source
    * check.verify(true, 'live /quotes matches the rulebook')

    Examples:
      | read('../rulebooks/rating/scenarios.json') |
