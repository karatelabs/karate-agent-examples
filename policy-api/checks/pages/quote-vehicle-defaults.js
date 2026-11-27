// @description: PolicyDesk quote wizard — keep the vehicle defaults and go Next to the coverage step
// @params: (none)
bot.act('#wizard-next', 'click');
bot.wait("location.hash == '#/quote/coverage'");
