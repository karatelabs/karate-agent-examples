@ignore
Feature: Loan Decisioning service — the HTTP surface the spec describes

  # Stood up in-process by karate-config.js (karate.start). POST /decisions runs the service function in
  # sut/decision.js — the implementation the spec's tasks claim to have delivered — and returns its result.
  # A validation failure is a 400 naming the offending field, never an outcome.
  #
  # @ignore because this is a mock DEFINITION, not a test: its scenario names are request matchers and its
  # steps read `request`, which exists only while serving. A suite that sweeps the project root
  # (Runner.suite('.') — what an agent reaches for when it picks the entry point itself) would otherwise
  # execute the matcher as a scenario and fail with `request is not defined`. Mock serving iterates the
  # feature's sections directly and never consults tags, so the tag costs the mock nothing.

  Background:
    # project-root-anchored ('/sut/...'): resolves identically from a feature run AND from config-eval.
    * def decide = read('/sut/decision.js')

  Scenario: pathMatches('/decisions') && methodIs('post')
    * def result = decide(request)
    * def responseStatus = result.error ? 400 : 200
    * def response = result.error ? result.error : result

  Scenario:
    * def responseStatus = 404
    * def response = { error: 'Unknown endpoint' }
