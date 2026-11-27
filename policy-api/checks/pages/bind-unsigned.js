// @description: PolicyDesk bind screen — press Bind without a signed application, waiting for the refusal banner
// @params: (none)
bot.act('#bind-confirm', 'click');
bot.wait("document.querySelector('#banner').textContent.trim().length > 0");
