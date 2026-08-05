@grpc
Feature: insurance rating — unary + streaming against the RatingService (gRPC)

  # TAGGED @grpc BECAUSE IT NEEDS A LEAF THE LEAN ENGINE DOES NOT CARRY. The console image bakes the lean
  # agent jar, so `karate.channel('grpc')` there fails with "cannot find [grpc]" — the capability is
  # absent, not broken. Run the whole kit on an engine that bundles the protocol leaves (the karate-async
  # jar, or mount it into /jars), or select around it: Runner.run('checks', {tags:'~@grpc'}).

  # THE ORACLE IS THE RULEBOOK, on every protocol. The premium is a business value the `rating` rulebook
  # computes, so no scenario below pins a number: each asks Rule.execute what the premium SHOULD be and
  # asserts the engine agrees. Same rules, same requirements, second protocol — a rate edit (the console's
  # Lookups tab) never requires EDITING this feature; the rows go red only when the engine and the rules
  # genuinely disagree (which a one-sided rate edit is: the Java engine hardcodes its own rates).
  # NOTE `policyClass` is the one field the engine returns that the rulebook does NOT model, so no oracle
  # can price it. It is asserted here as the BUSINESS RULE it stands for (prior claims ⇒ SUBSTANDARD, a
  # clean in-band driver ⇒ PREFERRED) — a deliberate, named exception, not a copied number. The honest
  # fix is to model it in the rulebook as a `calc.req`-linked arm.
  # The saved scenarios drive THIS protocol too (the outline below reads the same
  # rulebooks/rating/scenarios.json the REST spine uses). Proto JSON is strict about unknown fields, so a
  # raw row's `id`/`label` would be rejected on the wire — send `check.input`, the oracle's own view of the
  # row with that metadata removed. One row, two protocols, no copies to keep in sync.

  Background:
    # host/port/protoRoots come from karate-boot.js (central config); the feature names the rest
    * def session = karate.channel('grpc')
    * session.proto = 'proto/rating.proto'
    * session.service = 'RatingService'

  # THE SPINE, gRPC edition — every saved scenario, driven against the live RatingService. The REST twin
  # is checks/rating-acceptance.feature; both read the same rows and ask the same rulebook for the answer,
  # so adding a scenario in the console covers BOTH protocols with no feature edit.
  Scenario Outline: <_id> — <_label>
    * def check = Rule.execute('rating', __row)
    * session.method = 'Rate'
    # `check.input` = the saved row minus the rulebook's `id`/`label` (proto JSON rejects unknown fields)
    * session.send(check.input)
    * def reply = session.pop()
    * match reply contains check.output
    * check.verify(true, 'the live RatingService agrees with the rulebook')

    Examples:
      | read('../rulebooks/rating/scenarios.json') |

  # policyClass is the one field the engine returns that the rulebook does NOT model (see the note above),
  # so it is asserted here — once, as the business rule it stands for — rather than per saved row.
  Scenario: policy classification — the field no oracle can price
    * session.method = 'Rate'
    * session.send({ state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: false })
    * match session.pop().policyClass == 'PREFERRED'
    * session.send({ state: 'CA', coverage: 'COLLISION', driverAge: 40, priorClaims: true })
    * match session.pop().policyClass == 'SUBSTANDARD'

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
