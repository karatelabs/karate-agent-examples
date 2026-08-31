Feature: Stonebridge Fleet Auto - quote lifecycle checks (SOT-prose section 5).
  Runs against the served stateful mock. Premiums are never pinned: where a price
  matters the rating rulebook is the oracle. POST /clock is the mock's documented
  test seam for deterministic expiry checks - it fixes the observation date for
  every later call, so each dated step states the date in force.

Background:
  * url baseUrl
  * def setToday = function(d){ return karate.http(baseUrl).path('clock').post({ today: d }).body.today }
  * def saved = Rule.load('rating').scenarios
  * def rowById = function(id){ return karate.filter(saved, function(s){ return s._id == id })[0] }
  * def validSubmission = rowById('baseline-suburban-mixed')

@req=FLEET-001/1 @req=FLEET-010/1
Scenario: a valid submission is recorded and awaits rating
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  And match response == { id: '#string', status: 'submitted', submission: '#(check.input)', premium: null, reason: null, ratingDate: null, policyNumber: null }
  * def id = response.id
  # stateful read-back: the recorded quote awaits rating
  Given path 'quotes', id
  When method get
  Then status 200
  And match response == { id: '#(id)', status: 'submitted', submission: '#(check.input)', premium: null, reason: null, ratingDate: null, policyNumber: null }

@req=FLEET-001/2
Scenario: a submission with no vehicles is rejected as invalid input, not priced
  * def noVehicles = karate.merge(Rule.execute('rating', validSubmission).input, { vans: 0, lightTrucks: 0, heavyTrucks: 0 })
  Given path 'quotes'
  And request noVehicles
  When method post
  Then status 400
  And match response == { error: 'no_vehicles', message: '#string' }

@req=FLEET-001/3
Scenario: a submission with a field outside its documented domain is rejected
  * def base = Rule.execute('rating', validSubmission).input
  Given path 'quotes'
  And request karate.merge(base, { territory: 'offshore' })
  When method post
  Then status 400
  And match response == { error: 'invalid_input', message: '#string' }

  Given path 'quotes'
  And request karate.merge(base, { claimsCount: 7 })
  When method post
  Then status 400
  And match response == { error: 'invalid_input', message: '#string' }

  Given path 'quotes'
  And request karate.merge(base, { youngestDriverAge: 17 })
  When method post
  Then status 400
  And match response == { error: 'invalid_input', message: '#string' }

@req=FLEET-010/2
Scenario: rating prices the quote per the rating rules and stamps the rating date
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-02-01') == '2026-02-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == check.outcome
  And match response.premium == check.output.premium
  And match response.ratingDate == '2026-02-01'
  * check.verify(true, 'rating a submitted quote priced it per the rulebook and stamped the rating date')

@req=FLEET-002/1 @req=FLEET-002/3 @req=FLEET-010/2
Scenario: rating an excluded risk (young driver) records the decline with no premium
  * def row = rowById('declined-young-driver')
  * def check = Rule.execute('rating', row)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response == { id: '#(id)', status: 'declined', submission: '#(check.input)', premium: null, reason: '#string', ratingDate: null, policyNumber: null }
  And match response.status == check.outcome
  And match response.reason == check.output.reason
  * check.verify(true, 'the mock declined the young-driver fleet exactly as the rulebook rules')

@req=FLEET-002/2 @req=FLEET-002/3
Scenario: rating a fleet with out-of-state operations records the decline with no premium
  * def row = rowById('declined-out-of-state')
  * def check = Rule.execute('rating', row)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response == { id: '#(id)', status: 'declined', submission: '#(check.input)', premium: null, reason: '#string', ratingDate: null, policyNumber: null }
  And match response.reason == check.output.reason
  * check.verify(true, 'the mock declined the out-of-state fleet exactly as the rulebook rules')

@req=FLEET-010/3
Scenario: a declined quote is terminal - it can be neither re-rated nor bound
  * def row = rowById('declined-young-driver')
  * def check = Rule.execute('rating', row)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == 'declined'

  Given path 'quotes', id, 'rate'
  When method post
  Then status 409
  And match response == { error: 'declined_terminal', message: '#string' }

  Given path 'quotes', id, 'bind'
  When method post
  Then status 409
  And match response == { error: 'declined_terminal', message: '#string' }

@req=FLEET-010/4
Scenario: an expired quote refuses binding until re-rated; re-rating restores it
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.ratingDate == '2026-01-01'

  # 61 days after the rating date the quote is expired - no further action
  * match setToday('2026-03-03') == '2026-03-03'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 409
  And match response == { error: 'quote_expired', message: '#string' }

  # re-rating stamps a fresh rating date and the quote is actionable again
  * match setToday('2026-03-03') == '2026-03-03'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.ratingDate == '2026-03-03'
  And match response.premium == check.output.premium

  * match setToday('2026-03-04') == '2026-03-04'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 200
  And match response.status == 'bound'

@req=FLEET-010/4
Scenario: a quote is still bindable on day 60 exactly (working assumption FLEET-OQ-004)
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200

  * match setToday('2026-03-02') == '2026-03-02'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 200
  And match response.status == 'bound'

@req=FLEET-009/1 @req=FLEET-010/6
Scenario: a high-premium quote is referred - priced, but not bindable before approval
  * def row = rowById('referred-over-threshold')
  * def check = Rule.execute('rating', row)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == 'referred'
  And match response.status == check.outcome
  And match response.premium == check.output.premium
  * check.verify(true, 'the mock referred the over-threshold fleet at the rulebook premium')

  * match setToday('2026-01-02') == '2026-01-02'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 409
  And match response == { error: 'approval_required', message: '#string' }

@req=FLEET-010/5 @req=FLEET-010/7
Scenario: approval clears a referred quote for binding without changing the premium
  * def row = rowById('referred-over-threshold')
  * def check = Rule.execute('rating', row)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == 'referred'
  * def referredPremium = response.premium

  * match setToday('2026-01-02') == '2026-01-02'
  Given path 'quotes', id, 'approve'
  When method post
  Then status 200
  And match response.status == 'approved'
  And match response.premium == referredPremium
  And match response.premium == check.output.premium

  * match setToday('2026-01-03') == '2026-01-03'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 200
  And match response.status == 'bound'
  And match response.policyNumber == '#string'

@req=FLEET-010/7
Scenario: binding a rated unexpired quote issues the policy
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == 'rated'

  * match setToday('2026-01-15') == '2026-01-15'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 200
  And match response == { id: '#(id)', status: 'bound', submission: '#(check.input)', premium: '#(check.output.premium)', reason: null, ratingDate: '2026-01-01', policyNumber: '#string' }

  # stateful read-back: the issued policy persists
  Given path 'quotes', id
  When method get
  Then status 200
  And match response.status == 'bound'
  And match response.policyNumber == '#string'

@req=FLEET-010/8
Scenario: a bound quote can be neither bound again nor re-rated
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  * match setToday('2026-01-01') == '2026-01-01'
  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  * match setToday('2026-01-02') == '2026-01-02'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 200
  And match response.status == 'bound'

  * match setToday('2026-01-03') == '2026-01-03'
  Given path 'quotes', id, 'bind'
  When method post
  Then status 409
  And match response == { error: 'already_bound', message: '#string' }

  Given path 'quotes', id, 'rate'
  When method post
  Then status 409
  And match response == { error: 'already_bound', message: '#string' }

@noreq
Scenario: approving a non-referred quote is refused (working assumption FLEET-OQ-005)
  # deliberately @noreq: the guide leaves this case to the product owner (FLEET-OQ-005);
  # this pins the working assumption so a silent behavior change is caught
  * def check = Rule.execute('rating', validSubmission)
  Given path 'quotes'
  And request check.input
  When method post
  Then status 201
  * def id = response.id
  Given path 'quotes', id, 'approve'
  When method post
  Then status 409
  And match response == { error: 'not_referred', message: '#string' }

  Given path 'quotes', id, 'rate'
  When method post
  Then status 200
  And match response.status == 'rated'
  Given path 'quotes', id, 'approve'
  When method post
  Then status 409
  And match response == { error: 'not_referred', message: '#string' }

@noreq
Scenario: an unknown quote id is a 404 on every lifecycle verb
  Given path 'quotes', 'Q-000000'
  When method get
  Then status 404
  And match response == { error: 'not_found', message: '#string' }

  Given path 'quotes', 'Q-000000', 'rate'
  When method post
  Then status 404
  And match response == { error: 'not_found', message: '#string' }

  Given path 'quotes', 'Q-000000', 'bind'
  When method post
  Then status 404
  And match response == { error: 'not_found', message: '#string' }
