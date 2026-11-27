// @description: PolicyDesk quote wizard — press the side panel's quick Rate and wait for its figure
// @params: (none)
bot.act('#quick-rate', 'click');
bot.wait("document.querySelector('#quick-out').textContent.trim().length > 0");
