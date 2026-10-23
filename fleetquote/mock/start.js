// Start the Stonebridge Fleet Auto mock (run from the served console):
//   var mock = File.call('/mock/start.js')
// The handlers close over the served engine, where boot.ext('rules') has bound
// Rule - so the mock prices via the 'rating' rulebook, never its own numbers.
var start = function (opts) {
    var handlers = File.call('/mock/handlers.js');
    var port = opts && opts.port !== undefined ? opts.port : 8090;
    var config = { openapi: '/openapi.yaml', port: port, handlers: handlers };
    if (opts) {
        config.arg = opts;
    }
    return Http.mock(config);
};
start;
