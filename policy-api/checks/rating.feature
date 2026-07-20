Feature: insurance rating — unary + streaming against the RatingService (gRPC)

  # THE ORACLE IS THE RULEBOOK, on every protocol. The premium is a business value the `rating` rulebook
  # computes, so no scenario below pins a number: each asks Rule.execute what the premium SHOULD be and
  # asserts the engine agrees. Same rules, same requirements, second protocol — a rate edit (the console's
  # Lookups tab) never requires EDITING this feature; the rows go red only when the engine and the rules
  # genuinely disagree (which a one-sided rate edit is: the Java engine hardcodes its own rates).
  # NOTE `policyClass` is the one field the engine returns that the rulebook does NOT model, so no oracle
  # can price it. It is asserted here as the BUSINESS RULE it stands for (prior claims ⇒ SUBSTANDARD, a
  # clean in-band driver ⇒ PREFERRED) — a deliberate, named exception, not a copied number. The honest
  # fix is to model it in the rulebook as a `calc.req`-linked arm.
  # Rows are inline here (not read from rulebooks/rating/scenarios.json like the REST spine) because proto
  # JSON is STRICT about unknown fields: a saved row's `id`/`label` would be rejected on the wire. Feed a
  # saved row to gRPC by trimming it to the proto's own fields first.

  Background:
    # host/port/protoRoots come from karate-boot.js (central config); the feature names the rest
    * def session = karate.channel('grpc')
    * session.proto = 'proto/rating.proto'
    * session.service = 'RatingService'

  Scenario: unary rate — a CA collision quote
    * def row = { state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false }
    * def check = Rule.execute('rating', row)
    * session.method = 'Rate'
    * session.send(row)
    * def reply = session.pop()
    * match reply contains check.output
    # not rule-modelled (see the note above): a clean 25-70 driver is PREFERRED
    * match reply.policyClass == 'PREFERRED'
    * check.verify(true, 'the live RatingService agrees with the rulebook')

  # Exercise the INPUT dimensions (coverage enum + driver_age BVA + prior_claims bool, read off the proto):
  # LIABILITY + COLLISION and a young/with-priors driver are covered; COMPREHENSIVE is left to the streaming
  # scenario, so the Coverage tab's dimensions show which value-classes are tested and which are gaps.
  Scenario: coverage + driver-age dimensions
    * session.method = 'Rate'
    * def young = { state: 'TX', coverage: 'LIABILITY', driverAge: 19, priorClaims: true }
    * session.send(young)
    * def youngReply = session.pop()
    * match youngReply contains Rule.execute('rating', young).output
    # not rule-modelled (see the note above): prior claims downgrade the class
    * match youngReply.policyClass == 'SUBSTANDARD'
    * def adult = { state: 'NY', coverage: 'COLLISION', driverAge: 50, priorClaims: false }
    * session.send(adult)
    * def adultReply = session.pop()
    * match adultReply contains Rule.execute('rating', adult).output
    * match adultReply.policyClass == 'PREFERRED'

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
    * def row = { state: 'WA', coverage: 'COMPREHENSIVE', driverAge: 50, priorClaims: false }
    * def check = Rule.execute('rating', row)
    * session.method = 'StreamQuotes'
    * session.count = 3
    * session.send(row)
    * def quotes = session.collect()
    * match quotes[0] contains check.output
    # the per-term discount is engine behaviour the rulebook does not model. Assert the REQUIREMENT
    # DIRECTIONALLY — paying for a longer term costs less per month — rather than re-implementing the
    # arithmetic here, which would just be another copy of the system pretending to be an oracle.
    * assert quotes[1].monthlyPremium < quotes[0].monthlyPremium
    * assert quotes[2].monthlyPremium < quotes[1].monthlyPremium
    * match each quotes contains { currency: 'USD', policyClass: '#string' }

  # NOTE: BatchRate (client-streaming) and Negotiate (bidi) are deliberately NOT exercised here — they are
  # the open worklist Coverage.gaps() surfaces (2 of 4 methods covered). Ask an agent to author them.
