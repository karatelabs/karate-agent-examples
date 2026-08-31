Feature: Stonebridge Fleet Auto - rating checks.
  Data-driven over the rating rulebook's own saved scenarios: every row is a named
  business case, the rulebook is the oracle (Rule.execute), and no premium number
  is ever pinned in this file. check.verify records that the live mock agreed with
  the rulebook, which clears the oracleOnly disclosure on the criteria each row reaches.

Background:
  * url baseUrl

Scenario Outline: <_id> - <_label>
  # the ORACLE: run the saved row through the rulebook
  * def check = Rule.execute('rating', __row)
  # the SYSTEM: submit then rate against the stateful mock
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  And match response == { id: '#string', status: 'submitted', submission: '#(check.input)', premium: null, reason: null, ratingDate: null, policyNumber: null }
  * def id = response.id

  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == check.outcome
  And match response.premium == check.output.premium
  And match response.reason == check.output.reason
  # a declined quote carries no rating date; a priced one is stamped
  And match response.ratingDate == (check.outcome == 'declined' ? null : '#string')
  # the stamp: something OUTSIDE the rulebook (the mock lifecycle) agreed with it
  * check.verify(true, 'mock POST /quotes/{id}/rate matches the rating rulebook')

  Examples:
    | read('/rulebooks/rating/scenarios.json') |
