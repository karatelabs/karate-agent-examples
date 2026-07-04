@ignore
Feature: rating readiness — DRY RUN, no live call (the advanced / optional beat; preserved, not in the suite)

  # @ignore'd on purpose: out of the default suite + CI, and the console's Runner.run skips @ignore, so
  # comment out the @ignore line above to run it (or just type the two JSAPI calls in the console).
  #
  # THE ADVANCED CAPABILITY: a confidence-to-ship verdict WITHOUT running a single live test. Rule.cover
  # projects the rulebook's calc.req criteria into the RTM as SIMULATED — positive evidence the rules
  # realize the requirements, but NOT a live green (a rule can't verify itself; only a real call on the wire
  # earns COVERED). Useful for pre-flight gating before the system even exists. The LIVE spine is
  # checks/rating-acceptance.feature; this is its run-free counterpart, kept for the "you don't even need to
  # run it" beat.

  Scenario: the rulebook realizes the requirements as SIMULATED — no HTTP call, still NOT READY
    * def cover = Rule.cover('rating')
    * def readiness = Requirement.readiness()
    * print 'dry-run verdict (no live call):', readiness.verdict
    # only the senior-driver criterion (RATE-001/2) is the gap; the rest read SIMULATED, so still NOT READY
    * match readiness.state == 'NOT_READY'
