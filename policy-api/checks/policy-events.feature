@ignore
Feature: policy-events — emit a bound-policy event (Avro) to the policy-events topic (Kafka)

  # The OPTIONAL fourth beat (README section 4). It is @ignore'd so it never runs in a "run all checks"
  # sweep without a broker up. To enable the Kafka beat:
  #   1. start the broker + registry:  ( cd kafka && docker compose up -d )
  #   2. uncomment the cov.kafka block in karate-boot.js and restart the serve process
  #   3. remove the @ignore tag above, then:  Runner.run('checks/policy-events.feature')
  # A produced policy-event lands on cov.kafka as policy-events#publish (COVERED); the Avro eventType enum
  # + rating.priorClaims bool become reverse-inferred field dimensions (Coverage.dimensions).

  Background:
    # bootstrap + schemaRegistry come from karate-boot.js (central config)
    * def channel = karate.channel('kafka')
    * channel.register({ name: 'policy-event', path: 'kafka/policy-event.avsc' })

  Scenario: a bound policy emits a BOUND policy-event
    * def producer = channel.producer()
    * producer.topic = 'policy-events'
    * producer.schema = 'policy-event'
    * producer.value = { policyId: 'POL-1001', holder: 'Ada Lovelace', eventType: 'BOUND', rating: { monthlyPremium: 100, priorClaims: false } }
    * producer.send()
