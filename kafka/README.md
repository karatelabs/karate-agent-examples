# Kafka

Testing Kafka with Karate — produce and consume, JSON and Avro, message headers, and a filtering
consumer. The broker and a Confluent Schema Registry come up with `docker compose`, so the example runs
standalone.

```
docker-compose.yml     a single-process KRaft broker + Schema Registry
hello.avsc             the Avro schema used by the Avro check
checks/kafka.feature   the checks
karate-boot.js         cluster coordinates for the whole suite, set once
```

## What you need

1. **The engine** — `karate-async-2.1.3.RC1.jar` from the
   [releases](https://github.com/karatelabs/karate-addons/releases). Put it beside this folder.
2. **A licence** — a `karate.lic` file at `.karate/karate.lic` in this folder, or the same text in the
   `KARATE_LICENSE_TEXT` environment variable. Kafka needs the `kafka` entitlement.
3. **JDK 21+** and **Docker**.

## Run it

```bash
docker compose up -d

# wait for the registry, then create the two topics
curl -sf localhost:8081/subjects
for t in json-topic avro-topic; do
  docker compose exec -T kafka kafka-topics --create --if-not-exists \
    --topic "$t" --partitions 1 --replication-factor 1 --bootstrap-server localhost:29092
done

java -jar ../karate-async-2.1.3.RC1.jar checks

docker compose down
```

Four scenarios should pass. The HTML report is written to `target/karate-reports/`.

> **See it without running anything.** This kit runs on every push, and its report is
> published here: **<https://karatelabs.github.io/karate-agent-examples/kafka/>**

## How a check is written

Open a channel, then take a producer and a consumer from it:

```cucumber
* def channel = karate.channel('kafka')

* def consumer = channel.consumer()
* consumer.topic = 'json-topic'
* consumer.count = 1
* consumer.start()

* def producer = channel.producer()
* producer.topic = 'json-topic'
* producer.key = 'k1'
* producer.value = { message: 'hello', n: 42 }
* producer.send()

* match consumer.pop().value == { message: 'hello', n: 42 }
```

**Start the consumer before you produce.** `start()` subscribes and returns immediately; if you produce
first, the message can be gone before anyone is listening. `pop()` reads one record and `collect()` reads
`count` of them — those are the calls that block, bounded by `timeout`.

Each record that comes back is `{ key, value, headers, offset }`.

**Producer keys:** `topic` · `key` · `value` · `headers` · `schema` · `send()`
**Consumer keys:** `topic` · `count` · `timeout` · `filter` · `schema` · `start()` · `pop()` · `collect()`

`filter` takes a function and only records it accepts are counted — useful when a topic carries traffic
your check does not care about:

```cucumber
* consumer.filter = x => x.key != 'skip-me'
```

## Avro and Protobuf

Register a schema once by name, then refer to it from the producer and the consumer:

```cucumber
* channel.register({ name: 'hello', path: '/hello.avsc' })
* producer.schema = 'hello'
* consumer.schema = 'hello'
```

`.avsc` is Avro and goes through the Schema Registry, so `kafka.schemaRegistry` must be set in
`karate-boot.js`. `.proto` is Protobuf, sent as bytes and decoded with the registered descriptor — no
registry needed:

```cucumber
* channel.register({ name: 'hello-proto', path: '/hello.proto', message: 'Hello', roots: ['/'] })
```

With no `schema` at all, values are plain JSON bytes — nothing to register.

### Paths

A path is resolved against the project — this folder. `/hello.avsc` is anchored at the project root,
`hello.avsc` is relative to it, and both find the same file. A file outside the project — a keystore
mounted as a secret — is written as `file:/path/to/keystore.p12`. A leading `/` always means the project,
never the file system root.

## TLS

Set the keystore and truststore in `karate-boot.js`:

```js
var kafka = boot.ext('kafka');
kafka.ssl = {
  protocol: 'SSL',
  truststore: '/ssl/client.truststore.p12', truststorePassword: 'secret',
  keystore:   '/ssl/client.keystore.p12',   keystorePassword:   'secret', keyPassword: 'secret'
};
// PKCS12 keystores need this — the Kafka client assumes JKS otherwise
kafka.props = { 'ssl.truststore.type': 'PKCS12', 'ssl.keystore.type': 'PKCS12' };
```

For SASL, put the usual `sasl.*` client properties in `kafka.props`.

## Pointing this at your own cluster

Change `kafka.bootstrap` (and `kafka.schemaRegistry`, if you use Avro) in `karate-boot.js`, put your own
topic names in the checks, and delete `docker-compose.yml` — it exists only so this example runs
standalone. Both values read an override at run time, so CI can point elsewhere without editing a file:

```bash
java -jar ../karate-async-2.1.3.RC1.jar -Dkafka.bootstrap=broker.internal:9092 checks
```
