Feature: STOMP over WebSocket — a custom wire protocol via a codec

  # STOMP is a frame-based protocol carried over a WebSocket. StompCodec (in server/) converts each
  # frame to and from { command, headers, body }, so the check reads as ordinary Karate rather than
  # as string wrangling. Your own protocol works the same way — write a codec, and checks stay clean.

  Scenario: connect, subscribe, send, and receive the broadcast
    * def StompCodec = Java.type('StompCodec')
    * def session = karate.channel('websocket')
    * session.url = 'ws://localhost:8091/stomp'
    * session.codec = new StompCodec()
    * session.start()

    * session.send({ command: 'CONNECT', headers: { 'accept-version': '1.2', 'heart-beat': '0,0' } })
    * match session.pop().command == 'CONNECTED'

    * session.send({ command: 'SUBSCRIBE', headers: { id: 'sub-0', destination: '/topic/greetings' } })
    * session.send({ command: 'SEND', headers: { destination: '/app/hello' }, body: { name: 'foo' } })

    * def message = session.pop()
    * match message.command == 'MESSAGE'
    * match message.body.content == 'Hello, foo!'

  Scenario: a receipt confirms the disconnect
    * def StompCodec = Java.type('StompCodec')
    * def session = karate.channel('websocket')
    * session.url = 'ws://localhost:8091/stomp'
    * session.codec = new StompCodec()
    * session.start()

    * session.send({ command: 'CONNECT', headers: { 'accept-version': '1.2', 'heart-beat': '0,0' } })
    * match session.pop().command == 'CONNECTED'

    * session.send({ command: 'DISCONNECT', headers: { receipt: 'disc-0' } })
    * def receipt = session.pop()
    * match receipt.command == 'RECEIPT'
    * match receipt.headers['receipt-id'] == 'disc-0'
