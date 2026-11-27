function fn() {
  var isInt = '#? typeof _ === "number" && _ % 1 === 0';
  return {
    quote: {
      id: '#string',
      policyClass: '#regex (PREFERRED|STANDARD|SUBSTANDARD)',
      monthlyPremium: isInt,
      currency: 'USD'
    },
    policy: {
      id: '#string',
      quoteId: '#string',
      holder: '#string',
      state: '#regex [A-Z]{2}',
      monthlyPremium: isInt,
      status: '#regex (BOUND|CANCELLED)'
    },
    claim: {
      id: '#string',
      policyId: '#string',
      amount: isInt,
      status: '#regex (OPEN|APPROVED|DENIED)'
    },
    error400: { error: '#string', field: '#string' },
    error404: { error: '#string', id: '#string' }
  };
}
