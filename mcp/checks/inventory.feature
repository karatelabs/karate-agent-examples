Feature: MCP — discover tools, call them, and assert both kinds of failure

  Background:
    # the url comes from karate-boot.js, so a check names only what it calls. The first verb negotiates
    # the protocol era — modern first, falling back to the handshake era — and caches the result.
    * def mcp = karate.channel('mcp')
    # the demo server keeps its inventory in memory, so every scenario mints its own skus and no run
    # collides with a scenario beside it or with an earlier run against the same server
    * def id = karate.uuid().substring(0, 8)

  Scenario: the catalog — what the server says it can do
    * def response = mcp.tools()
    # the list ENVELOPE differs by era (the newer one adds ttlMs/cacheScope), so response.tools is the
    # portable assertion
    * match response.tools[*].name contains ['add_item', 'get_item', 'adjust_stock', 'list_items', 'search_items', 'remove_item']
    # what the negotiation settled on, readable after any verb
    * match mcp.server.revision == '#string'
    * match ['modern', 'legacy'] contains mcp.server.lane

  Scenario: a call, and the side effect it leaves behind
    * def sku = 'WIDGET-' + id
    * def added = mcp.invoke('add_item', { sku: sku, name: 'Widget', qty: 4 })
    * match added.structuredContent == { sku: '#(sku)', name: 'Widget', qty: 4 }
    * match mcp.invoke('adjust_stock', { sku: sku, delta: -3 }).structuredContent.qty == 1
    * def response = mcp.invoke('get_item', { sku: sku })
    * match response.structuredContent == { sku: '#(sku)', name: 'Widget', qty: 1 }
    # the same answer also arrives as a text block, which every result carries
    * match karate.fromString(response.content[0].text) == { sku: '#(sku)', name: 'Widget', qty: 1 }

  Scenario: a tool's own error is a result, not a failed step
    # isError says the TOOL refused; the protocol call itself succeeded, so the step passes and the
    # refusal is asserted like any other value
    * def response = mcp.invoke('get_item', { sku: 'GHOST-' + id })
    * match response.isError == true
    * match response.content[0].text == 'no item with sku GHOST-' + id

  Scenario: a protocol error is data, through the raw primitive
    # call() is the conformance primitive — one request, no negotiation, and it never throws whatever the
    # server answers. So an error envelope is a value to match on, where invoke() would fail the step.
    * mcp.connect()
    * def response = mcp.call('resources/read', { uri: 'inventory://nope' })
    * match response.body.error.code == -32602

    # a bad tools/call is NOT answered that way by this SDK: both a missing required argument and an
    # unknown tool name come back as an isError result whose text carries the -32602
    * match mcp.call('tools/call', { name: 'add_item', arguments: {} }).body.result.isError == true
    * def unknown = mcp.call('tools/call', { name: 'no_such_tool', arguments: {} })
    * match unknown.body.result.content[0].text == 'MCP error -32602: Tool no_such_tool not found'

  Scenario: resources and prompts
    * match mcp.resources().resources[*].uri contains 'inventory://summary'
    * match mcp.prompts().prompts[*].name contains 'restock-plan'
    * mcp.invoke('add_item', { sku: 'BOLT-' + id, name: 'Bolt', qty: 7 })
    * def summary = mcp.call('resources/read', { uri: 'inventory://summary' })
    * def counts = karate.fromString(summary.body.result.contents[0].text)
    * match counts.items == '#number'
    * assert counts.units >= 7

  Scenario: search, and a bounded list
    * def sku = 'CABLE-' + id
    * mcp.invoke('add_item', { sku: sku, name: 'Coax cable ' + id, qty: 2 })
    * match mcp.invoke('search_items', { q: 'coax cable ' + id }).structuredContent.items[*].sku contains sku
    * match mcp.invoke('list_items', { limit: '1' }).structuredContent.items == '#[1]'
