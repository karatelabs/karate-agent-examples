// @description: PolicyDesk quote wizard — fill the driver step and go Next to the vehicle step
// @params: first, last, age, state, priorClaims
bot.act('#driver-first', 'input', __arg.first);
bot.act('#driver-last', 'input', __arg.last);
bot.act('#driver-age', 'input', '' + __arg.age);
bot.act('#driver-state', 'select', __arg.state);
if (__arg.priorClaims) {
    bot.act('#prior-claims', 'check');
}
bot.act('#wizard-next', 'click');
bot.wait("location.hash == '#/quote/vehicle'");
