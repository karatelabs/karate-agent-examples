@kafka
Feature: policy-events — emit a bound-policy event (Avro) to the policy-events topic (Kafka)

  # The OPTIONAL fourth beat (README section 5). Tagged @kafka: it needs the kafka protocol leaf (the
  # karate-async engine) AND a live broker, so a "run all checks" sweep on a lean engine selects around it
  # with {tags:'~@kafka'} — the same posture as the @grpc tag on rating.feature. To enable the beat:
  #   1. start the broker + registry:  ( cd kafka && docker compose up -d )
  #   2. set KARATE_KAFKA_ON=1 (env, or a -D sysprop) — karate-boot.js boots the kafka ext + cov.kafka
  #      off that flag (restart the serve process so boot re-reads it)
  #   3. run it:  Runner.run('checks/policy-events.feature')  — or launch the whole cross-protocol
  #      suite with the flag set: KARATE_GRPC_ON=1 KARATE_KAFKA_ON=1 … launch suite.karate.js
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
