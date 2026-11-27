// @description: PolicyDesk quote wizard — pick a coverage line on the coverage step
// @params: coverage (LIABILITY | COLLISION | COMPREHENSIVE)
bot.act('#cov-' + __arg.coverage, 'check');
