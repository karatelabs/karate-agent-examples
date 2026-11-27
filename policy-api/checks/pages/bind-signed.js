// @description: PolicyDesk bind screen — bind with a signed application on file, landing on the BOUND policy
// @params: holder (optional — the named insured; the form's prefill stands when omitted)
if (__arg && __arg.holder) {
    bot.act('#bind-holder', 'input', __arg.holder);
}
bot.act('#bind-signed', 'check');
bot.act('#bind-confirm', 'click');
bot.wait("location.hash.indexOf('#/policy/') == 0 && document.querySelector('#policy-status').textContent == 'BOUND'");
