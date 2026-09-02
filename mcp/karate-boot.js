// Activates the MCP client and sets the endpoint once, for the whole suite. Every karate.channel('mcp')
// session starts from this url; a session can still override it.
var mcp = boot.ext('mcp');
mcp.url = boot.sysprop('mcp.url', boot.sysenv('MCP_URL') || 'http://localhost:3001/mcp');

// The tool catalog is the coverage universe: a saved tools/list result, one item per tool. Every
// tools/call a session makes is an observed hit, so a tool the checks never call is reported NOTCOVERED.
var cov = boot.ext('coverage');
cov.mcp = 'checks/mcp-tools.json';
