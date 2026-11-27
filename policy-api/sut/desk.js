// desk.js — PolicyDesk, an underwriting desk over the policy API (openapi.yaml). Every action is a call to
// the API at `?api=<base url>` (default: the origin that served this page): createQuote, bindPolicy,
// getPolicy, listPolicies, cancelPolicy, fileClaim, getClaim.
//
// Seeded defects, off unless named in `?defects=` (comma-separated):
//   display  the worksheet totals its own build-up, whose territory table has no Florida row
//   drift    the coverage step's rate control is renamed (label and id)
(function () {
    var params = new URLSearchParams(location.search);
    var apiBase = (params.get('api') || '').replace(/\/$/, '');
    var defects = {};
    (params.get('defects') || '').split(',').forEach(function (d) {
        if (d.trim()) {
            defects[d.trim()] = true;
        }
    });

    var ACCOUNTS = [
        { id: 'A-10482', holder: 'Priya Natarajan', state: 'CA', since: 2016 },
        { id: 'A-10517', holder: 'Walter Brandt', state: 'NY', since: 2009 },
        { id: 'A-10933', holder: 'Rosa Delgado', state: 'FL', since: 2021 },
        { id: 'A-11206', holder: 'Hank Ostrowski', state: 'TX', since: 2012 },
        { id: 'A-11358', holder: 'Mei Tanaka', state: 'WA', since: 2019 },
        { id: 'A-11402', holder: 'Jordan Ellis', state: 'CA', since: 2023 }
    ];
    var STEPS = ['driver', 'vehicle', 'coverage'];

    function $(id) {
        return document.getElementById(id);
    }

    function money(n) {
        return '$' + Number(n).toFixed(2);
    }

    function text(id, value) {
        $(id).textContent = value == null ? '' : value;
    }

    function load(key, fallback) {
        try {
            var v = sessionStorage.getItem('policydesk.' + key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function save(key, value) {
        sessionStorage.setItem('policydesk.' + key, JSON.stringify(value));
    }

    function banner(message) {
        var b = $('banner');
        b.textContent = message || '';
        b.hidden = !message;
    }

    function api(method, path, body) {
        var init = { method: method, headers: {} };
        if (body !== undefined) {
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(body);
        }
        return fetch(apiBase + path, init).then(function (res) {
            if (res.status === 204) {
                return null;
            }
            return res.json().then(function (json) {
                if (!res.ok) {
                    throw new Error((json && json.error) || ('HTTP ' + res.status));
                }
                return json;
            });
        });
    }

    function fail(e) {
        banner('The policy service refused the request: ' + e.message);
    }

    // ---- menus -----------------------------------------------------------------------------------

    function toggle(button, menu, open) {
        var show = open == null ? menu.hidden : open;
        menu.hidden = !show;
        button.setAttribute('aria-expanded', show ? 'true' : 'false');
    }

    function closeMenus() {
        toggle($('menu-submission'), $('menu-submission-flyout'), false);
        toggle($('nav-new'), $('menu-new'), false);
    }

    $('nav-new').addEventListener('click', function (e) {
        e.stopPropagation();
        toggle($('nav-new'), $('menu-new'));
    });
    $('menu-submission').addEventListener('click', function (e) {
        e.stopPropagation();
        toggle($('menu-submission'), $('menu-submission-flyout'));
    });
    $('menu-new-quote').addEventListener('click', function () {
        closeMenus();
        save('draft', {});
        location.hash = '#/quote/driver';
        if (location.hash === '#/quote/driver') {
            route();
        }
    });
    $('menu-new-claim').addEventListener('click', function () {
        closeMenus();
        location.hash = '#/search';
        banner('Open the policy the loss is on, then file the claim from its Claims panel.');
    });
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.menu-root')) {
            closeMenus();
        }
    });

    // ---- routing ---------------------------------------------------------------------------------

    var SCREENS = ['search', 'submissions', 'quote', 'worksheet', 'bind', 'policy', 'documents'];
    var CRUMBS = { search: 'Find', submissions: 'Submissions', quote: 'Submissions › New quote', worksheet: 'Submissions › Rating worksheet',
        bind: 'Submissions › Bind', policy: 'Policies › Policy', documents: 'Documents' };

    function route() {
        var parts = (location.hash || '#/search').replace(/^#\//, '').split('/');
        var screen = SCREENS.indexOf(parts[0]) >= 0 ? parts[0] : 'search';
        SCREENS.forEach(function (s) {
            $('screen-' + s).hidden = s !== screen;
        });
        var rail = screen === 'quote' || screen === 'worksheet' || screen === 'bind' ? 'submissions' : screen === 'policy' ? 'search' : screen;
        document.querySelectorAll('.rail nav a').forEach(function (a) {
            a.classList.toggle('on', a.getAttribute('data-route') === rail);
        });
        text('crumbs', CRUMBS[screen]);
        if (screen !== 'search') {
            banner('');
        }
        var render = { search: renderSearch, submissions: renderSubmissions, quote: renderQuote, worksheet: renderWorksheet,
            bind: renderBind, policy: renderPolicy, documents: renderDocuments }[screen];
        render(parts[1]);
    }

    window.addEventListener('hashchange', route);

    // ---- find ------------------------------------------------------------------------------------

    function renderSearch() {
        runSearch();
    }

    function runSearch() {
        var q = $('search-q').value.trim();
        var state = /^[A-Za-z]{2}$/.test(q) ? q.toUpperCase() : null;
        var needle = state ? '' : q.toLowerCase();
        var accounts = ACCOUNTS.filter(function (a) {
            return state ? a.state === state : (a.holder + ' ' + a.id).toLowerCase().indexOf(needle) >= 0;
        });
        $('accounts-body').innerHTML = accounts.length ? accounts.map(function (a) {
            return '<tr><td>' + a.id + '</td><td>' + a.holder + '</td><td>' + a.state + '</td><td>' + a.since + '</td></tr>';
        }).join('') : '<tr class="empty"><td colspan="4">No accounts match.</td></tr>';
        api('GET', '/policies' + (state ? '?state=' + state : '')).then(function (policies) {
            var shown = policies.filter(function (p) {
                return !needle || (p.holder + ' ' + p.id).toLowerCase().indexOf(needle) >= 0;
            });
            text('policies-count', '(' + shown.length + ')');
            $('policies-body').innerHTML = shown.length ? shown.map(function (p) {
                return '<tr><td><a href="#/policy/' + encodeURIComponent(p.id) + '">' + p.id + '</a></td><td>' + p.holder + '</td><td>' + p.state
                    + '</td><td>' + money(p.monthlyPremium) + '</td><td><span class="pill ' + p.status + '">' + p.status + '</span></td></tr>';
            }).join('') : '<tr class="empty"><td colspan="5">No policies match.</td></tr>';
        }).catch(fail);
    }

    $('search-go').addEventListener('click', runSearch);
    $('search-q').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            runSearch();
        }
    });

    // ---- submissions -----------------------------------------------------------------------------

    function renderSubmissions() {
        var subs = load('submissions', []);
        $('submissions-body').innerHTML = subs.length ? subs.slice().reverse().map(function (s) {
            var link = s.policyId ? '#/policy/' + encodeURIComponent(s.policyId) : '#/worksheet/' + encodeURIComponent(s.quote.id);
            return '<tr><td><a href="' + link + '">' + s.quote.id + '</a></td><td>' + s.driver + ' (' + s.input.driverAge + ')</td><td>'
                + s.input.state + '</td><td>' + s.input.coverage + '</td><td>' + money(s.quote.monthlyPremium) + '</td><td><span class="pill '
                + (s.policyId ? 'BOUND' : 'Quoted') + '">' + (s.policyId ? 'Bound' : 'Quoted') + '</span></td></tr>';
        }).join('') : '<tr class="empty"><td colspan="6">No submissions yet. Start one from New › Submission.</td></tr>';
    }

    function submission(quoteId) {
        var subs = load('submissions', []);
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].quote.id === quoteId) {
                return subs[i];
            }
        }
        return null;
    }

    function updateSubmission(quoteId, patch) {
        var subs = load('submissions', []);
        subs.forEach(function (s) {
            if (s.quote.id === quoteId) {
                Object.keys(patch).forEach(function (k) {
                    s[k] = patch[k];
                });
            }
        });
        save('submissions', subs);
    }

    // ---- quote wizard ----------------------------------------------------------------------------

    var rateButton = $('rate-quote');
    if (defects.drift) {
        rateButton.id = 'coverage-rate-quote-btn';
        rateButton.textContent = 'Calculate premium';
    }

    function readDraft() {
        var coverage = document.querySelector('input[name=coverage]:checked');
        return {
            first: $('driver-first').value.trim(),
            last: $('driver-last').value.trim(),
            driverAge: $('driver-age').value === '' ? null : Number($('driver-age').value),
            state: $('driver-state').value,
            priorClaims: $('prior-claims').checked,
            coverage: coverage ? coverage.value : null
        };
    }

    function writeDraft(d) {
        $('driver-first').value = d.first || '';
        $('driver-last').value = d.last || '';
        $('driver-age').value = d.driverAge == null ? '' : d.driverAge;
        $('driver-state').value = d.state || '';
        $('prior-claims').checked = !!d.priorClaims;
        document.querySelectorAll('input[name=coverage]').forEach(function (r) {
            r.checked = r.value === d.coverage;
        });
    }

    function renderQuote(step) {
        var at = STEPS.indexOf(step) >= 0 ? STEPS.indexOf(step) : 0;
        writeDraft(load('draft', {}));
        STEPS.forEach(function (s, i) {
            $('step-' + s).hidden = i !== at;
            $('stepper-' + s).className = i === at ? 'on' : i < at ? 'done' : '';
        });
        $('wizard-back').hidden = at === 0;
        $('wizard-next').hidden = at === STEPS.length - 1;
        rateButton.hidden = at !== STEPS.length - 1;
        text('quick-out', '—');
    }

    function currentStep() {
        return (location.hash.split('/')[2]) || 'driver';
    }

    function quoteRequest(d) {
        return { state: d.state, coverage: d.coverage, driverAge: d.driverAge, priorClaims: d.priorClaims };
    }

    $('wizard-next').addEventListener('click', function () {
        save('draft', readDraft());
        var at = STEPS.indexOf(currentStep());
        location.hash = '#/quote/' + STEPS[Math.min(at + 1, STEPS.length - 1)];
    });
    $('wizard-back').addEventListener('click', function () {
        save('draft', readDraft());
        var at = STEPS.indexOf(currentStep());
        location.hash = '#/quote/' + STEPS[Math.max(at - 1, 0)];
    });
    rateButton.addEventListener('click', function () {
        var d = readDraft();
        save('draft', d);
        api('POST', '/quotes', quoteRequest(d)).then(function (quote) {
            var subs = load('submissions', []);
            subs.push({ quote: quote, input: quoteRequest(d), driver: (d.first + ' ' + d.last).trim() });
            save('submissions', subs);
            location.hash = '#/worksheet/' + encodeURIComponent(quote.id);
        }).catch(fail);
    });
    $('quick-rate').addEventListener('click', function () {
        var d = readDraft();
        api('POST', '/quotes', quoteRequest(d)).then(function (quote) {
            text('quick-out', money(quote.monthlyPremium));
        }).catch(fail);
    });

    // ---- worksheet -------------------------------------------------------------------------------

    function renderWorksheet(quoteId) {
        var s = submission(decodeURIComponent(quoteId || ''));
        text('ws-total', '');
        if (!s) {
            banner('No such quote in this session.');
            return;
        }
        var ws = deskWorksheet(s.input, s.quote, defects);
        text('ws-quote', s.quote.id);
        $('ws-lines').innerHTML = ws.lines.map(function (l) {
            return '<tr data-line="' + l.key + '"><td>' + l.label + '</td><td class="num">' + money(l.amount) + '</td></tr>';
        }).join('');
        text('ws-driver', s.driver + ', age ' + s.input.driverAge + (s.input.priorClaims ? ', prior claims' : ''));
        text('ws-state', DESK_STATE_NAMES[s.input.state]);
        text('ws-coverage', s.input.coverage.charAt(0) + s.input.coverage.slice(1).toLowerCase());
        text('ws-class', s.quote.policyClass);
        text('ws-total', money(ws.total));
    }

    $('to-bind').addEventListener('click', function () {
        location.hash = '#/bind/' + encodeURIComponent($('ws-quote').textContent);
    });
    $('ws-copy').addEventListener('click', function () {
        if (navigator.clipboard) {
            navigator.clipboard.writeText($('ws-total').textContent).catch(function () {});
        }
    });
    $('ws-print').addEventListener('click', function () {
        window.print();
    });

    // ---- bind ------------------------------------------------------------------------------------

    function renderBind(quoteId) {
        var s = submission(decodeURIComponent(quoteId || ''));
        if (!s) {
            banner('No such quote in this session.');
            return;
        }
        text('bind-quote', s.quote.id);
        text('bind-premium', money(s.quote.monthlyPremium));
        $('bind-holder').value = s.driver;
        $('bind-effective').value = new Date().toISOString().slice(0, 10);
        $('bind-signed').checked = false;
    }

    $('bind-confirm').addEventListener('click', function () {
        if (!$('bind-signed').checked) {
            banner('A signed application must be on file before binding.');
            return;
        }
        var quoteId = $('bind-quote').textContent;
        api('POST', '/policies', { quoteId: quoteId, holder: $('bind-holder').value.trim() }).then(function (policy) {
            updateSubmission(quoteId, { policyId: policy.id });
            location.hash = '#/policy/' + encodeURIComponent(policy.id);
        }).catch(fail);
    });

    // ---- policy ----------------------------------------------------------------------------------

    function renderPolicy(policyId) {
        var id = decodeURIComponent(policyId || '');
        text('policy-number', '');
        text('policy-status', '');
        $('claim-card').hidden = true;
        $('claim-refresh').hidden = true;
        api('GET', '/policies/' + encodeURIComponent(id)).then(function (p) {
            text('policy-holder', p.holder);
            text('policy-state', DESK_STATE_NAMES[p.state] || p.state);
            text('policy-premium', money(p.monthlyPremium));
            text('policy-quote', p.quoteId);
            $('policy-status').className = 'pill ' + p.status;
            text('policy-status', p.status);
            text('policy-number', p.id);
        }).catch(fail);
    }

    function currentPolicy() {
        return $('policy-number').textContent;
    }

    function confirmThen(message, action) {
        text('confirm-text', message);
        $('confirm').hidden = false;
        $('confirm-yes').onclick = function () {
            $('confirm').hidden = true;
            action();
        };
    }

    $('confirm-no').addEventListener('click', function () {
        $('confirm').hidden = true;
    });
    $('policy-refresh').addEventListener('click', function () {
        renderPolicy(currentPolicy());
    });
    $('policy-cancel').addEventListener('click', function () {
        var id = currentPolicy();
        confirmThen('Cancel policy ' + id + '? The policy stays on file as cancelled.', function () {
            api('DELETE', '/policies/' + encodeURIComponent(id)).then(function () {
                renderPolicy(id);
            }).catch(fail);
        });
    });
    function showClaim(claim) {
        text('claim-id', claim.id);
        text('claim-amount-shown', money(claim.amount));
        text('claim-status', claim.status);
        $('claim-card').hidden = false;
        $('claim-refresh').hidden = false;
    }

    $('claim-file').addEventListener('click', function () {
        var amount = Number($('claim-amount').value);
        api('POST', '/claims', { policyId: currentPolicy(), amount: amount }).then(showClaim).catch(fail);
    });
    $('claim-refresh').addEventListener('click', function () {
        api('GET', '/claims/' + encodeURIComponent($('claim-id').textContent)).then(showClaim).catch(fail);
    });

    // ---- documents -------------------------------------------------------------------------------

    function renderDocuments() {
        var docs = load('documents', []);
        $('docs-body').innerHTML = docs.length ? docs.map(function (d) {
            return '<tr><td>' + d.name + '</td><td>' + d.kind + '</td><td>' + Math.max(1, Math.round(d.size / 1024)) + ' KB</td><td>' + d.added + '</td></tr>';
        }).join('') : '<tr class="empty"><td colspan="4">No documents yet.</td></tr>';
    }

    $('doc-file').addEventListener('change', function () {
        var docs = load('documents', []);
        Array.prototype.forEach.call($('doc-file').files, function (f) {
            docs.push({ name: f.name, size: f.size, kind: $('doc-kind').value, added: new Date().toISOString().slice(0, 10) });
        });
        save('documents', docs);
        $('doc-file').value = '';
        renderDocuments();
    });
    $('doc-attach').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            $('doc-file').click();
        }
    });

    route();
})();
