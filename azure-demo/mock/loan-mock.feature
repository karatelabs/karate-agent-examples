Feature: Loan Decision API mock — the REST backend for the cov.openapi half

  # Stood up by karate-config.js (karate.start). It computes each decision with the SAME independent twin
  # the browser SUT runs (sut/loan-calc.js), so the REST surface and the UI agree by construction — one
  # engine, two surfaces. getDecision (GET /decisions/{id}) is intentionally NOT routed here, so it stays an
  # honest coverage gap (the worklist Coverage.gaps() shows), mirroring the openapi.yaml operation set.

  Background:
    # the exact decision function the page loads via <script> — read() evaluates the file and returns it.
    # project-root-anchored ('/sut/...'): resolves identically from a feature run AND config-eval (D79/paths.md).
    * def loanDecision = read('/sut/loan-calc.js')

  Scenario: pathMatches('/decisions') && methodIs('post')
    * def d = loanDecision(request, {})
    * def responseStatus = 200
    * def response = { decision: '#(d.decision)', apr: '#(d.apr)', dti: '#(d.dti)', monthlyPayment: '#(d.monthlyPayment)' }

  Scenario:
    * def responseStatus = 404
    * def response = { error: 'Unknown endpoint' }
