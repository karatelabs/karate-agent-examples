Feature: gRPC — unary, streaming, metadata and the error path

  Background:
    # host and port come from karate-boot.js, so a check names only the contract.
    # The .proto is read at run time to build dynamic descriptors — there are no generated stubs here.
    * def session = karate.channel('grpc')
    * session.proto = '/proto/hello.proto'
    * session.service = 'HelloService'

  Scenario: unary — one request, one response
    * session.method = 'Hello'
    * session.send({ name: 'John' })
    * match session.pop() == { message: 'hello John' }

  Scenario: request metadata, and reading the response metadata back
    * session.method = 'Hello'
    * session.metadata = { authorization: 'secret' }
    * session.send({ name: 'Smith' })
    * match session.pop() == { message: 'hello Smith' }
    * match session.metadataResponse contains { 'authorization-response': 'secret-response' }

  Scenario: the error path — an empty name is rejected
    # session.status carries the gRPC status of the last call, so a check can assert a failure
    # instead of pop() throwing.
    * session.method = 'Hello'
    * session.send({ name: '' })
    * match session.collect() == []
    * match session.status == 'INVALID_ARGUMENT'

  Scenario: server streaming — collect a known number of responses
    * session.method = 'LotsOfReplies'
    * session.count = 3
    * session.send({ name: 'John' })
    * match session.collect() == [{ message: 'hello John 1' }, { message: 'hello John 2' }, { message: 'hello John 3' }]

  Scenario: client streaming — many requests, one response
    # stream = true keeps the request stream open; flush() closes it and releases the response.
    * session.method = 'LotsOfGreetings'
    * session.stream = true
    * session.send({ name: 'John' })
    * session.send({ name: 'Smith' })
    * session.flush()
    * match session.pop() == { message: 'hello [John, Smith]' }

  Scenario: bidirectional streaming — a response per request on one open stream
    * session.method = 'BidiHello'
    * session.stream = true
    * session.count = 3
    * session.send({ name: 'John' })
    * session.send({ name: 'Smith' })
    * session.send({ name: 'Jane' })
    * match session.collect() ==
      """
      [
        { message: 'hello [John]' },
        { message: 'hello [John, Smith]' },
        { message: 'hello [John, Smith, Jane]' }
      ]
      """
