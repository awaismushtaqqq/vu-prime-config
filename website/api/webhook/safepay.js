// Safepay webhook (server-to-server) + redirect handler.
// Activation sirf verified webhook par hoti hai; redirect sirf user ko success page par
// bhejta hai (browser se aane wale data par bharosa nahi karte).

import { verifyWebhook } from '../../lib/providers/safepay.js';
import { activateUser } from '../../lib/activation.js';
import { getPlan } from '../../lib/plans.js';
import { json, readRawBody, siteUrl, normalizeEmail } from '../../lib/util.js';

function pick(obj, ...paths) {
  for (const path of paths) {
    let cur = obj;
    for (const key of path.split('.')) {
      if (cur && typeof cur === 'object' && key in cur) cur = cur[key];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return null;
}

export default async function handler(req, res) {
  const base = siteUrl(req);

  // ── Browser redirect: sirf success page par forward karo ──
  if (req.method === 'GET') {
    const q = req.query || {};
    const email = normalizeEmail(q.email) || '';
    const params = new URLSearchParams({
      email,
      plan: String(q.plan || ''),
      order: String(q.order_id || ''),
    });
    res.statusCode = 303;
    res.setHeader('Location', `${base}/success.html?${params.toString()}`);
    res.end();
    return;
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const raw = await readRawBody(req);
  const signature =
    req.headers['x-sfpy-signature'] ||
    req.headers['x-safepay-signature'] ||
    req.headers['x-signature'];

  if (!verifyWebhook(raw, signature)) {
    console.warn('safepay webhook signature invalid');
    return json(res, 401, { error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const type = String(pick(event, 'type', 'event', 'data.type') || '');
  const status = String(pick(event, 'data.state', 'data.status', 'status') || '').toLowerCase();
  const paid =
    /paid|completed|succeeded|success/.test(type.toLowerCase()) ||
    ['paid', 'completed', 'succeeded', 'success', 'tracker_ended'].includes(status);

  if (!paid) return json(res, 200, { ok: true, ignored: true, type, status });

  const orderId = pick(
    event,
    'data.metadata.order_id',
    'data.order_id',
    'data.tracker',
    'data.token'
  );
  const email = normalizeEmail(pick(event, 'data.metadata.email', 'data.customer.email', 'data.email'));
  const plan = getPlan(pick(event, 'data.metadata.plan', 'data.plan'));

  if (!orderId || !email || !plan) {
    console.error('safepay webhook missing fields', { orderId, email, plan: plan && plan.id });
    return json(res, 400, { error: 'Missing order metadata' });
  }

  const amount = Number(pick(event, 'data.amount', 'amount'));
  if (Number.isFinite(amount) && Math.round(amount) !== Math.round(plan.price)) {
    console.error('safepay amount mismatch', { expected: plan.price, got: amount });
    return json(res, 400, { error: 'Amount mismatch' });
  }

  try {
    const activation = await activateUser({
      email,
      planId: plan.id,
      orderId: String(orderId),
      note: `safepay:${orderId}`,
    });
    return json(res, 200, { ok: true, ...activation });
  } catch (err) {
    console.error('safepay activation failed:', err);
    // 500 return karo taake Safepay webhook retry kare.
    return json(res, 500, { error: 'Activation failed' });
  }
}
