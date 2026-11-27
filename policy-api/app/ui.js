// The policy desk as an underwriter reads it — labels, help and wording only. Every key is a name the
// model declares (rulebooks/rating/twin.js); what is sent stays the binding's.
ui = {
    title: 'Policy lifecycle playground',
    subtitle: 'prototype · every action is a real call to the policy service mock',
    currency: 'USD',
    resource: {
        label: 'Policy',
        columns: ['id', 'status', 'holder', 'state', 'coverage', 'driverAge', 'monthlyPremium', 'policyClass']
    },
    fields: {
        id: { label: 'Policy number' },
        status: {
            label: 'Policy status', format: 'badge',
            values: { QUOTED: 'Quoted', BOUND: 'Bound', CANCELLED: 'Cancelled' }
        },
        state: { label: 'Rating state', help: 'The US state the rate book prices the risk in.' },
        coverage: { label: 'Coverage' },
        driverAge: { label: 'Driver age', help: 'Under 25 and over 70 carry a loading.' },
        priorClaims: { label: 'Prior claims', help: 'A driver with prior claims pays a surcharge.' },
        monthlyPremium: { label: 'Monthly premium', format: 'money', help: 'Priced by the rate book when the quote is made.' },
        policyClass: { label: 'Risk class' },
        holder: { label: 'Policyholder' },
        claim: { label: 'Open claim' },
        amount: { label: 'Claim amount', format: 'money' }
    },
    commands: {
        createQuote: { title: 'Get a quote', help: 'Price a new policy from the rate book: state, coverage, driver age and prior claims.' },
        bindPolicy: { title: 'Bind the policy', help: 'Turn the quote into a policy in force for the named holder, at the quoted premium.' },
        fileClaim: { title: 'File a claim', help: 'Open a claim against a bound policy. One claim is open at a time.' },
        cancelPolicy: { title: 'Cancel the policy', help: 'Cancel a bound policy. A cancelled policy takes no further claim.' },
        readPolicy: { title: 'Look up a policy', help: 'One policy as the desk holds it now.' },
        listPolicy: { title: 'List all policies', help: 'Every policy the desk holds.' }
    },
    reasons: {
        QUOTE_EXISTS: 'A quote is priced once; get a new quote for another policy',
        POLICY_NOT_QUOTED: 'This policy is already bound',
        POLICY_NOT_BOUND: 'Only a bound policy can be cancelled',
        POLICY_NOT_ACTIVE: 'Only a bound policy can carry a claim',
        CLAIM_ALREADY_OPEN: 'This policy already carries an open claim'
    }
};
