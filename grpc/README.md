# gRPC

Testing a gRPC service with Karate — unary, all three streaming shapes, request/response metadata, and
the error path. **No generated stubs on the test side:** the engine reads the `.proto` at run time and
builds dynamic descriptors, so there is nothing to generate and nothing to regenerate when the contract
changes. Your checks stay plain text.

```
proto/hello.proto      the contract — read by BOTH the server build and the checks
checks/hello.feature   the checks
karate-boot.js         host/port for the whole suite, set once
server/                the demo service under test (stands in for your service)
```

## What you need

1. **The engine** — `karate-async-2.1.2.RC3.jar` from the
   [releases](https://github.com/karatelabs/karate-addons/releases). Put it beside this folder, or
   anywhere you like and adjust the paths below.
2. **A licence** — a `karate.lic` file at `.karate/karate.lic` in this folder, or the same text in the
   `KARATE_LICENSE_TEXT` environment variable. gRPC needs the `grpc` entitlement.
3. **JDK 21+**, and Maven to build the demo service.

## Run it

Build and start the demo service (one terminal):

```bash
mvn -f server/pom.xml package
java -cp "../karate-async-2.1.2.RC3.jar:server/target/classes" demo.DemoServer 50051
```

The service needs no fat jar of its own — the engine jar already carries gRPC and protobuf, so putting it
on the classpath is enough.

Run the checks (another terminal):

```bash
java -jar ../karate-async-2.1.2.RC3.jar checks
```

You should see six scenarios pass. The HTML report is written to `target/karate-reports/`.

> **See it without running anything.** This kit runs on every push, and its report is
> published here: **<https://karatelabs.github.io/karate-agent-examples/grpc/>**

## How a check is written

A session is opened on the `grpc` channel, told which contract to use, then driven:

```cucumber
* def session = karate.channel('grpc')
* session.proto = '/proto/hello.proto'
* session.service = 'HelloService'
* session.method = 'Hello'
* session.send({ name: 'John' })
* match session.pop() == { message: 'hello John' }
```

`host` and `port` are not repeated in every check — they are set once in `karate-boot.js` and inherited.
Any session can still override them.

**Streaming.** `send()` then `pop()` is the unary shape. For a server stream, set `count` to how many
responses you expect and use `collect()`. For a client stream or a bidirectional stream, set
`stream = true`, `send()` as many times as you need, and `flush()` to close the request side.

**Metadata.** `session.metadata` sets request headers; `session.metadataResponse` reads back what the
server returned.

**Errors.** `session.status` carries the gRPC status of the last call (`OK`, `INVALID_ARGUMENT`, …), so a
check can assert a failure instead of `pop()` throwing.

### Paths

A path is resolved against the project — this folder. `/proto/hello.proto` is anchored at the project
root, `proto/hello.proto` is relative to it, and both find the same file. A path on the machine outside
the project — a mounted secret, a cert in `/etc/ssl` — is written as `file:/etc/ssl/ca.pem`. A leading
`/` always means the project, never the file system root.

## TLS and mTLS

Set the certificate paths and the channel switches to TLS; leave them out and it is plaintext. Either put
them in `karate-boot.js` to apply suite-wide:

```js
var grpc = boot.ext('grpc');
grpc.tls = {
  trustCert:  '/certs/ca.pem',        // verify the server
  clientCert: '/certs/client.pem',    // present a client cert (mTLS)
  clientKey:  '/certs/client-key.pem'
};
```

…or per session, with `session.trustCert` / `session.clientCert` / `session.clientKey`.

## Pointing this at your own service

Replace `proto/hello.proto` with your `.proto`, set `service` and `method` in the checks to match, and
point `karate-boot.js` at your host and port. Delete `server/` — it exists only so this example runs
standalone. If your `.proto` imports others, list the import roots in `karate-boot.js`:

```js
grpc.protoRoots = ['/', '/third-party-protos'];
```
