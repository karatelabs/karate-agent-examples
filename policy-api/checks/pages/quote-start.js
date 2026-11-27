// @description: PolicyDesk — New › Submission › Personal auto, landing on the driver step
// @params: (none)
bot.act('#nav-new', 'click');
bot.act('#menu-submission', 'click');
bot.act('#menu-new-quote', 'click');
bot.wait("location.hash == '#/quote/driver'");
