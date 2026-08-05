Feature: Kafka — produce and consume, as JSON and as Avro

  Background:
    # bootstrap and schemaRegistry come from karate-boot.js
    * def channel = karate.channel('kafka')

  # Start the consumer BEFORE producing, or it can miss the message. start() does not block;
  # pop() and collect() are the blocking reads.
  Scenario: JSON round-trip — no schema registry needed
    * def consumer = channel.consumer()
    * consumer.topic = 'json-topic'
    * consumer.count = 1
    * consumer.start()

    * def producer = channel.producer()
    * producer.topic = 'json-topic'
    * producer.key = 'k1'
    * producer.value = { message: 'hello', n: 42 }
    * producer.send()

    * def record = consumer.pop()
    * match record.key == 'k1'
    * match record.value == { message: 'hello', n: 42 }

  Scenario: message headers, and reading them back
    * def consumer = channel.consumer()
    * consumer.topic = 'json-topic'
    * consumer.count = 1
    * consumer.start()

    * def producer = channel.producer()
    * producer.topic = 'json-topic'
    * producer.key = 'k2'
    * producer.headers = { source: 'karate', tenant: 'acme' }
    * producer.value = { message: 'with headers' }
    * producer.send()

    * def record = consumer.pop()
    * match record.headers contains { source: 'karate', tenant: 'acme' }

  Scenario: Avro round-trip through the Schema Registry
    # register the schema once by name, then refer to it from the producer and the consumer
    * channel.register({ name: 'hello', path: '/hello.avsc' })

    * def consumer = channel.consumer()
    * consumer.topic = 'avro-topic'
    * consumer.count = 1
    * consumer.schema = 'hello'
    * consumer.start()

    * def producer = channel.producer()
    * producer.topic = 'avro-topic'
    * producer.schema = 'hello'
    * producer.value = { message: 'hello', status: 'NEW', info: { first: 1, second: true } }
    * producer.send()

    * match consumer.pop().value == { message: 'hello', status: 'NEW', info: { first: 1, second: true } }

  Scenario: consume several messages, and filter which ones count
    * def consumer = channel.consumer()
    * consumer.topic = 'json-topic'
    * consumer.count = 2
    * consumer.timeout = 10000
    # only records whose key is not 'skip-me' are collected
    * consumer.filter = x => x.key != 'skip-me'
    * consumer.start()

    * def producer = channel.producer()
    * producer.topic = 'json-topic'
    * producer.key = 'skip-me'
    * producer.value = { n: 0 }
    * producer.send()
    * producer.key = 'first'
    * producer.value = { n: 1 }
    * producer.send()
    * producer.key = 'second'
    * producer.value = { n: 2 }
    * producer.send()

    * def records = consumer.collect()
    * match records[0].key == 'first'
    * match records[1].key == 'second'
