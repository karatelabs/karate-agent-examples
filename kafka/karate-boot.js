// Cluster coordinates are set once here, for the whole suite — every karate.channel('kafka') producer
// and consumer is built from this config.
var kafka = boot.ext('kafka');
kafka.bootstrap = boot.sysprop('kafka.bootstrap', '127.0.0.1:29092');

// Needed for Avro. Leave it out if you only send JSON.
kafka.schemaRegistry = boot.sysprop('kafka.schemaRegistry', 'http://localhost:8081');

// Any other Kafka client property goes here verbatim — the escape hatch for SASL, compression, timeouts.
// kafka.props = { 'compression.type': 'gzip' };
