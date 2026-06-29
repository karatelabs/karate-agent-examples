Feature: insurance rating — unary + streaming against the RatingService (gRPC)

  Background:
    # host/port/protoRoots come from karate-boot.js (central config); the feature names the rest
    * def session = karate.channel('grpc')
    * session.proto = 'proto/rating.proto'
    * session.service = 'RatingService'

  Scenario: unary rate — a CA collision quote
    * session.method = 'Rate'
    * session.send({ state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false })
    * match session.pop() == { policyClass: 'PREFERRED', monthlyPremium: 100, currency: 'USD' }

  # Exercise the INPUT dimensions (coverage enum + driver_age BVA + prior_claims bool, read off the proto):
  # LIABILITY + COLLISION and a young/with-priors driver are covered; COMPREHENSIVE is left to the streaming
  # scenario, so the Coverage tab's dimensions show which value-classes are tested and which are gaps.
  Scenario: coverage + driver-age dimensions
    * session.method = 'Rate'
    * session.send({ state: 'TX', coverage: 'LIABILITY', driverAge: 19, priorClaims: true })
    * match session.pop() == { policyClass: 'SUBSTANDARD', monthlyPremium: 125, currency: 'USD' }
    * session.send({ state: 'NY', coverage: 'COLLISION', driverAge: 50, priorClaims: false })
    * match session.pop().monthlyPremium == 105

  # The sad-path (outcome) coverage gap, closed: an unsupported state is rejected with INVALID_ARGUMENT,
  # driven via session.status (not pop(), which would throw). The rich-error model (google.rpc.Status) is
  # asserted as typed details — a BadRequest field violation + an ErrorInfo reason, like an HTTP problem body.
  Scenario: error path — an unsupported state is rejected (rich error details)
    * session.method = 'Rate'
    * session.send({ state: 'ZZ', coverage: 'LIABILITY', driverAge: 40 })
    * match session.collect() == []
    * match session.status == 'INVALID_ARGUMENT'
    * match session.statusDetails contains { message: 'unsupported state' }
    * match session.statusDetails.details[*] contains deep { reason: 'STATE_UNSUPPORTED', domain: 'rating.karatelabs.io' }

  # Server-streaming: three term options (pay-monthly, semi-annual, annual) for a COMPREHENSIVE policy —
  # this is also where COMPREHENSIVE gets exercised for the coverage-line dimension.
  Scenario: server streaming — term options
    * session.method = 'StreamQuotes'
    * session.count = 3
    * session.send({ state: 'WA', coverage: 'COMPREHENSIVE', driverAge: 50, priorClaims: false })
    * match session.collect() == [{ policyClass: 'PREFERRED', monthlyPremium: 140, currency: 'USD' }, { policyClass: 'PREFERRED', monthlyPremium: 133, currency: 'USD' }, { policyClass: 'PREFERRED', monthlyPremium: 126, currency: 'USD' }]

  # NOTE: BatchRate (client-streaming) and Negotiate (bidi) are deliberately NOT exercised here — they are
  # the open worklist Coverage.gaps() surfaces (2 of 4 methods covered). Ask an agent to author them.
