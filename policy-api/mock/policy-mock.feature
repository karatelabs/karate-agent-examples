@ignore
Feature: insurance Policy API mock — the stand-in for the REST face, and the subject of the paired run

  # Stood up by karate-config.js (karate.start). This mock is not scenery: it is what a paired run puts
  # under claim (Contract.pair({mock:'mock/policy-mock.feature', provider:<the REST face>})), so every
  # behaviour here answers to rating-server's PolicyServer.java — the same contract, implemented twice.
  # Where the two disagree, one of them is wrong; the pair says which, and this file is usually it.
  #
  # cancelPolicy (DELETE /policies/{id}) and getClaim (GET /claims/{id}) are deliberately NOT routed: the
  # REST face implements them, this mock does not, and the suite exercises neither — so they stay the honest
  # coverage gaps the worklist shows (mirroring the gRPC half leaving BatchRate/Negotiate uncovered), and
  # the pair's claim reports the operations it did NOT speak for rather than rounding them up.

  Background:
    # NO java interop: a mock engine has the Java bridge OFF by default (it can assign attacker-controlled
    # request data, so leaving it on is an RCE vector), and karate-js has no `java` binding at all. This
    # line used to read `java.util.UUID.randomUUID()`, and every id it served was the literal string
    # `#(uuid())` — the embedded expression threw and the placeholder went out on the wire as data. No test
    # saw it because nothing asserted on `id`; a paired run did. Keep mock helpers pure JS.
    * def seq = 0
    * def nextId = function(){ seq = seq + 1; return 'pol-' + seq }
    # the rate book's own territories (rulebooks/rating/calc.js `stateFactor`) — a state outside them has no
    # factor to look up, so BOTH implementations refuse it rather than pricing it at zero
    * def rated = ['CA', 'NY', 'FL', 'TX', 'WA']
    * def coverages = ['LIABILITY', 'COLLISION', 'COMPREHENSIVE']
    # premium + policyClass mirror the `rating` rulebook (= the gRPC RatingService), so this mock and the
    # engine agree at every input, not just at age 40. Keep this in lockstep with rulebooks/rating/calc.js.
    * def premium = function(b){ var base = b.coverage == 'COMPREHENSIVE' ? 140 : b.coverage == 'COLLISION' ? 90 : 50; if (b.driverAge < 25) base += 40; else if (b.driverAge > 70) base += 25; if (b.priorClaims) base += 35; var sf = (b.state == 'NY' || b.state == 'FL') ? 15 : (b.state == 'CA' ? 10 : 0); return base + sf }
    * def policyClass = function(b){ return b.priorClaims ? 'SUBSTANDARD' : (b.driverAge >= 25 && b.driverAge <= 70 ? 'PREFERRED' : 'STANDARD') }
    # the 400 body is part of the contract too — same shape AND same words as the REST face, so the day a
    # check exercises an error path the two targets still agree
    * def badRequest = function(field, message){ return { error: message, field: field } }
    # TYPES ARE PART OF THE CONTRACT, and JS truthiness is where a stand-in quietly stops being one: `"40"`
    # is not 40 and `"true"` is not true, but both read as present-and-valid to a naive check — so this mock
    # would answer 201 (and a different premium) where the Java implementation answers 400. A paired run over
    # a suite that only sends well-typed bodies never sees it. These two guards are what keep the two
    # implementations the same program.
    * def isStr = function(v){ return typeof v == 'string' && v.trim() != '' }
    * def isInt = function(v){ return typeof v == 'number' && v == Math.floor(v) }
    * def orEmpty = function(r){ return r == null ? {} : r }
    # a bound policy has to be visible on read-back: a mock whose GET /policies is a hardcoded [] cannot
    # stand in for a provider, and the assertion that saw it was a paired run's response-layer comparison
    # (both legs passed `#array` and returned different numbers of elements)
    * def quotes = {}
    * def policies = []
    * def claims = {}
    * def findPolicy = function(id){ for (var i = 0; i < policies.length; i++) { if (policies[i].id == id) return policies[i] } return null }
    * def quoteError = function(b){ if (!isStr(b.state) || rated.indexOf(b.state) < 0) return badRequest('state', 'state must be one of [CA, NY, FL, TX, WA]'); if (!isStr(b.coverage) || coverages.indexOf(b.coverage) < 0) return badRequest('coverage', 'coverage must be one of [LIABILITY, COLLISION, COMPREHENSIVE]'); if (!isInt(b.driverAge) || b.driverAge < 18 || b.driverAge > 80) return badRequest('driverAge', 'driverAge must be between 18 and 80'); if (b.priorClaims != null && typeof b.priorClaims != 'boolean') return badRequest('priorClaims', 'priorClaims must be a boolean'); return null }
    * def quoteFor = function(b){ var id = nextId(); var q = { id: id, policyClass: policyClass(b), monthlyPremium: premium(b), currency: 'USD' }; quotes[id] = { state: b.state, monthlyPremium: q.monthlyPremium }; return q }
    # a policy carries the price of the QUOTE it was bound from — so an unknown quote is an invalid binding
    # request, not a policy at an invented premium (the 400 openapi.yaml declares for this operation)
    * def bindError = function(b){ if (!isStr(b.quoteId)) return badRequest('quoteId', 'quoteId is required'); if (!isStr(b.holder)) return badRequest('holder', 'holder is required'); if (!quotes[b.quoteId]) return badRequest('quoteId', 'no such quote: ' + b.quoteId); return null }
    * def policyFor = function(b){ var q = quotes[b.quoteId]; return { id: nextId(), quoteId: b.quoteId, holder: b.holder, state: q.state, monthlyPremium: q.monthlyPremium, status: 'BOUND' } }
    * def claimError = function(b){ if (!isStr(b.policyId)) return badRequest('policyId', 'policyId is required'); if (!isInt(b.amount) || b.amount < 1) return badRequest('amount', 'amount must be a positive integer'); if (!findPolicy(b.policyId)) return badRequest('policyId', 'no such policy: ' + b.policyId); return null }
    * def claimFor = function(b){ var c = { id: nextId(), policyId: b.policyId, amount: b.amount, status: 'OPEN' }; claims[c.id] = c; return c }

  Scenario: pathMatches('/quotes') && methodIs('post')
    * def req = orEmpty(request)
    * def bad = quoteError(req)
    * def responseStatus = bad ? 400 : 201
    * def response = bad ? bad : quoteFor(req)

  Scenario: pathMatches('/policies') && methodIs('post')
    * def req = orEmpty(request)
    * def bad = bindError(req)
    * def bound = bad ? null : policyFor(req)
    * def policies = bad ? policies : karate.append(policies, bound)
    * def responseStatus = bad ? 400 : 201
    * def response = bad ? bad : bound

  Scenario: pathMatches('/policies') && methodIs('get')
    * def state = paramValue('state')
    * def responseStatus = 200
    * def response = isStr(state) ? policies.filter(function(p){ return p.state == state }) : policies

  Scenario: pathMatches('/policies/{id}') && methodIs('get')
    * def found = findPolicy(pathParams.id)
    * def responseStatus = found ? 200 : 404
    * def response = found ? found : { error: 'no such policy', id: pathParams.id }

  Scenario: pathMatches('/claims') && methodIs('post')
    * def req = orEmpty(request)
    * def bad = claimError(req)
    * def responseStatus = bad ? 400 : 201
    * def response = bad ? bad : claimFor(req)

  Scenario:
    * def responseStatus = 404
    * def response = { error: 'Unknown endpoint' }
