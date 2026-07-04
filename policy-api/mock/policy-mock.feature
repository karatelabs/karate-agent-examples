Feature: insurance Policy API mock — a happy-path backend for the cov.openapi demo

  # Stand up by karate-config.js (karate.start). Just enough surface to exercise the operations so
  # cov.openapi lights up — the real pricing lives in the gRPC RatingService. cancelPolicy (DELETE
  # /policies/{id}) and getClaim (GET /claims/{id}) are intentionally NOT routed here, so they stay
  # honest coverage gaps (the worklist), mirroring the gRPC half leaving BatchRate/Negotiate uncovered.

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }
    # premium + policyClass mirror the `rating` rulebook (= the gRPC RatingService), so this mock and the
    # engine agree at every input, not just at age 40. Keep this in lockstep with rulebooks/rating/calc.js.
    * def premium = function(b){ var base = b.coverage == 'COMPREHENSIVE' ? 140 : b.coverage == 'COLLISION' ? 90 : 50; if (b.driverAge < 25) base += 40; else if (b.driverAge > 70) base += 25; if (b.priorClaims) base += 35; var sf = (b.state == 'NY' || b.state == 'FL') ? 15 : (b.state == 'CA' ? 10 : 0); return base + sf }
    * def policyClass = function(b){ return b.priorClaims ? 'SUBSTANDARD' : (b.driverAge >= 25 && b.driverAge <= 70 ? 'PREFERRED' : 'STANDARD') }

  Scenario: pathMatches('/quotes') && methodIs('post')
    * def responseStatus = 201
    * def response = { id: '#(uuid())', policyClass: '#(policyClass(request))', monthlyPremium: '#(premium(request))', currency: 'USD' }

  Scenario: pathMatches('/policies') && methodIs('post')
    * def responseStatus = 201
    * def response = { id: '#(uuid())', quoteId: '#(request.quoteId)', holder: '#(request.holder)', monthlyPremium: 100, status: 'BOUND' }

  Scenario: pathMatches('/policies') && methodIs('get')
    * def responseStatus = 200
    * def response = []

  Scenario: pathMatches('/policies/{id}') && methodIs('get')
    * def responseStatus = 404
    * def response = { error: 'no such policy', id: '#(pathParams.id)' }

  Scenario: pathMatches('/claims') && methodIs('post')
    * def responseStatus = 201
    * def response = { id: '#(uuid())', policyId: '#(request.policyId)', amount: '#(request.amount)', status: 'OPEN' }

  Scenario:
    * def responseStatus = 404
    * def response = { error: 'Unknown endpoint' }
