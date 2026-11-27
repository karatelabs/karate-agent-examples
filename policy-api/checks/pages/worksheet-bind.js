// @description: PolicyDesk rating worksheet — Bind policy, landing on the bind screen
// @params: (none)
bot.act('#to-bind', 'click');
bot.wait("location.hash.indexOf('#/bind/') == 0");
