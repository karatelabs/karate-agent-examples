// @description: PolicyDesk quote wizard — Rate quote, landing on the rating worksheet with its total shown
// @params: (none)
bot.act('#rate-quote', 'click');
bot.wait("location.hash.indexOf('#/worksheet/') == 0 && document.querySelector('#ws-total').textContent.trim().length > 0");
