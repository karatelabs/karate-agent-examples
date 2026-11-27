// @description: PolicyDesk policy screen — file a claim for a loss amount, waiting for the claim to show
// @params: amount
bot.act('#claim-amount', 'input', '' + __arg.amount);
bot.act('#claim-file', 'click');
bot.wait("document.querySelector('#claim-status') && document.querySelector('#claim-status').textContent.trim().length > 0");
