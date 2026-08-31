// Start the Stonebridge Fleet Auto mock (run from the served console):
//   var mock = File.call('/mock/start.js')
// The handlers close over the served engine, where boot.ext('rules') has bound
// Rule - so the mock prices via the 'rating' rulebook, never its own numbers.
var start = function (opts) {
    var handlers = File.call('/mock/handlers.js');
    var config = { openapi: '/openapi.yaml', port: 8090, handlers: handlers };
    if (opts) {
        config.arg = opts;
    }
    return Http.mock(config);
};
start;
