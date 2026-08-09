(() => {
  const $ = (id) => document.getElementById(id);
  const state = { plans: [], selected: null, provider: null, bank: null };

  const money = (n, c) => `${c === 'PKR' ? 'Rs ' : ''}${Number(n).toLocaleString('en-PK')}`;

  function showMsg(el, text, kind) {
    el.textContent = text;
    el.className = `msg show ${kind || 'info'}`;
  }
  function hideMsg(el) {
    el.className = 'msg';
  }

  function renderPlans() {
    const box = $('plans');
    box.innerHTML = '';
    state.plans.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'plan' + (state.selected === p.id ? ' selected' : '');
      el.innerHTML = `
        ${p.id === 'yearly' ? '<div class="badge">Best value</div>' : ''}
        <h3>${p.label}</h3>
        <div class="ur">${p.labelUr}</div>
        <div class="price">${money(p.price, p.currency)} <small>${p.days ? `/ ${p.days} din` : 'one time'}</small></div>
        <div class="tag">${p.tagline}</div>`;
      el.addEventListener('click', () => {
        state.selected = p.id;
        renderPlans();
      });
      box.appendChild(el);
    });
  }

  function renderBank() {
    if (!state.bank) return;
    $('bank-toggle').style.display = 'block';
    const labels = {
      bank: 'Bank',
      title: 'Account title',
      account: 'Account number',
      iban: 'IBAN',
      easypaisa: 'Easypaisa',
      jazzcash: 'JazzCash',
      whatsapp: 'WhatsApp',
    };
    $('bank-rows').innerHTML = Object.entries(state.bank)
      .map(([k, v]) => `<div class="row"><span>${labels[k] || k}</span><span>${v}</span></div>`)
      .join('');
  }

  async function loadPlans() {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      state.plans = data.plans || [];
      state.provider = data.provider;
      state.bank = data.bank;
      state.selected = state.selected || (state.plans[1] || state.plans[0] || {}).id || null;
      renderPlans();
      renderBank();
      if (data.support_whatsapp) $('support').textContent = data.support_whatsapp;
      if (!data.provider) {
        showMsg($('msg'), 'Online gateway abhi band hai — bank transfer option use karein.', 'info');
        $('pay').disabled = true;
        $('bank').style.display = 'block';
      }
    } catch {
      showMsg($('msg'), 'Plans load nahi ho sake. Page refresh karein.', 'err');
    }
  }

  /** JazzCash ko form POST chahiye — auto-submit form bana kar bhejte hain. */
  function submitForm(url, fields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v == null ? '' : String(v);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  async function pay() {
    const email = $('email').value.trim().toLowerCase();
    const msg = $('msg');
    hideMsg(msg);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return showMsg(msg, 'Sahi Gmail address likhein.', 'err');
    }
    if (!state.selected) return showMsg(msg, 'Pehle plan select karein.', 'err');

    const btn = $('pay');
    btn.disabled = true;
    btn.innerHTML = 'Payment page khul raha hai<span class="spinner"></span>';

    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: state.selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment shuru nahi ho saki');

      sessionStorage.setItem('vup_email', email);
      sessionStorage.setItem('vup_order', data.order_id || '');

      if (data.checkout.type === 'form_post') {
        submitForm(data.checkout.url, data.checkout.fields);
      } else {
        window.location.href = data.checkout.url;
      }
    } catch (err) {
      showMsg(msg, err.message, 'err');
      btn.disabled = false;
      btn.textContent = 'Pay karein';
    }
  }

  async function checkStatus() {
    const email = $('check-email').value.trim().toLowerCase();
    const msg = $('check-msg');
    hideMsg(msg);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return showMsg(msg, 'Sahi Gmail likhein.', 'err');
    }
    showMsg(msg, 'Check ho raha hai…', 'info');
    try {
      const res = await fetch(`/api/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check fail');
      if (data.banned) return showMsg(msg, 'Yeh account block hai. Support se rabta karein.', 'err');
      if (data.premium) {
        return showMsg(
          msg,
          data.expires
            ? `✅ Premium active hai (${data.plan || 'plan'}) — ${data.expires} tak.`
            : '✅ Lifetime premium active hai.',
          'ok'
        );
      }
      showMsg(msg, 'Is email par abhi koi active subscription nahi hai.', 'err');
    } catch (err) {
      showMsg(msg, err.message, 'err');
    }
  }

  $('year').textContent = new Date().getFullYear();
  $('pay').addEventListener('click', pay);
  $('check').addEventListener('click', checkStatus);
  $('bank-toggle').addEventListener('click', () => {
    const box = $('bank');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });
  const saved = sessionStorage.getItem('vup_email');
  if (saved) $('email').value = saved;
  if (new URLSearchParams(location.search).get('cancelled')) {
    showMsg($('msg'), 'Payment cancel ho gayi thi. Dobara koshish kar sakte hain.', 'info');
  }
  loadPlans();
})();
