# WebSocket

Testing WebSockets with Karate — raw text, JSON, collecting a stream of messages, and a custom
frame-based protocol (STOMP) handled by a codec. Both demo servers are included, and they need **no
build tool**: they compile against the engine jar alone.

```
checks/echo.feature    text, JSON and streaming against the echo server
checks/stomp.feature   STOMP — a custom wire protocol, via a codec
server/EchoServer.java sends back whatever you send it
server/StompBroker.java a small STOMP broker (connect · subscribe · send · receipt)
server/StompCodec.java  converts STOMP frames to and from { command, headers, body }
karate-boot.js         activates WebSocket support
```

## What you need

1. **The engine** — `karate-async-2.1.3.RC1.jar` from the
   [releases](https://github.com/karatelabs/karate-addons/releases). Put it beside this folder.
2. **A license** — a `karate.lic` file at `.karate/karate.lic` in this folder, or the same text in the
   `KARATE_LICENSE_TEXT` environment variable. WebSocket is part of the `openapi` entitlement.
3. **JDK 21+**. No Maven, no code generation.

## Run it

Compile the demo servers and start them (one terminal each, or background them):

```bash
javac -cp ../karate-async-2.1.3.RC1.jar -d server-classes server/*.java

java -cp "../karate-async-2.1.3.RC1.jar:server-classes" EchoServer 8090
java -cp "../karate-async-2.1.3.RC1.jar:server-classes" StompBroker 8091
```

Run the checks:

```bash
java -cp "../karate-async-2.1.3.RC1.jar:server-classes" io.karatelabs.Main run checks
```

Five scenarios should pass. The HTML report is written to `target/karate-reports/`.

> **See it without running anything.** This kit runs on every push, and its report is
> published here: **<https://karatelabs.github.io/karate-agent-examples/websocket/>**

> The checks are launched with `-cp … io.karatelabs.Main` rather than `java -jar` because
> `stomp.feature` loads `StompCodec` by name, so the compiled classes have to be on the classpath.
> `echo.feature` on its own runs fine with plain `java -jar ... run checks/echo.feature`.

## How a check is written

```cucumber
* def session = karate.channel('websocket')
* session.url = 'ws://localhost:8090/echo'
* session.start()
* session.send('hello')
* match session.pop() == 'hello'
```

`start()` opens the connection and returns; `pop()` reads one message and `collect()` reads `count` of
them — those are the calls that block, bounded by `timeout`. Set `count` before `start()` when you expect
several messages.

**Session keys:** `url` · `codec` · `count` · `timeout` · `headers` · `start()` · `send()` · `pop()` ·
`collect()` · `stop()`

Use `headers` for a handshake header — an auth token, say:

```cucumber
* session.headers = { Authorization: 'Bearer ' + token }
```

## Codecs — handling your own protocol

Without a codec, messages are raw text. A codec converts between the wire form and a value your check
can `match` on. That keeps protocol handling out of the checks:

- **`JsonTextCodec`** is built in — text on the wire, JSON in the check (see `echo.feature`).
- **`StompCodec`** in `server/` is a worked example of a custom one: it turns STOMP frames into
  `{ command, headers, body }` and back, so `stomp.feature` reads as ordinary Karate.

To handle your own protocol, copy `StompCodec.java` and change the two conversion methods.

## Pointing this at your own server

Change the `url` in the checks and delete `server/` — it exists only so this example runs standalone. If
your server speaks JSON, `JsonTextCodec` is likely all you need; if it speaks something else, write a
codec as above.
