Feature: WebSocket — raw text and JSON against the echo server

  Background:
    * def wsUrl = 'ws://localhost:8090/echo'

  Scenario: send text, read it back
    * def session = karate.channel('websocket')
    * session.url = wsUrl
    * session.start()
    * session.send('hello')
    * match session.pop() == 'hello'

  Scenario: JSON in, JSON out
    # a codec converts between the wire text and a value your check can match on. JsonTextCodec is
    # built in; StompCodec (in server/) shows how to write your own for a custom protocol.
    * def JsonTextCodec = Java.type('io.karatelabs.ext.websocket.JsonTextCodec')
    * def session = karate.channel('websocket')
    * session.url = wsUrl
    * session.codec = new JsonTextCodec()
    * session.start()
    * session.send({ type: 'ping', seq: 1 })
    * match session.pop() == { type: 'ping', seq: 1 }

  Scenario: collect a stream of messages
    # count says how many to wait for; collect() blocks until they arrive or the timeout passes
    * def session = karate.channel('websocket')
    * session.url = wsUrl
    * session.count = 3
    * session.start()
    * session.send('a')
    * session.send('b')
    * session.send('c')
    * match session.collect() == ['a', 'b', 'c']
