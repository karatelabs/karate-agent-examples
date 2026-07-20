@ignore
Feature: rating readiness — DRY RUN, no live call (the advanced / optional beat; preserved, not in the suite)

  # @ignore'd on purpose: out of the default suite + CI, and the console's Runner.run skips @ignore, so
  # comment out the @ignore line above to run it (or just type the two JSAPI calls in the console).
  #
  # THE ADVANCED CAPABILITY: a confidence-to-ship verdict WITHOUT running a single live test. Rule.cover
  # projects the rulebook's calc.req criteria into the RTM: the rules genuinely realize them, so they read
  # COVERED — but carrying `oracleOnly`, because a rule can't verify itself and nothing outside the rulebook
  # checked it. Readiness grades that like a gap, so the verdict stays honest. Useful for pre-flight gating
  # before the system even exists. The LIVE spine is checks/rating-acceptance.feature; this is its run-free
  # counterpart, kept for the "you don't even need to run it" beat.

  Scenario: the rulebook realizes the requirements, but only the rules vouch — still NOT READY
    * def cover = Rule.cover('rating')
    * def readiness = Requirement.readiness()
    * print 'dry-run verdict (no live call):', readiness.verdict
    # RATE-001/2 (senior driver) is an outright gap; the rest are vouched for by the rules alone
    * match readiness.state == 'NOT_READY'
