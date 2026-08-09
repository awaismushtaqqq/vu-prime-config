import { getPlan } from '../lib/plans.js';
import { activeProvider } from '../lib/providers/index.js';
import { json, normalizeEmail, randomId, readJsonBody, siteUrl } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const plan = getPlan(body.plan);

  if (!email) return json(res, 400, { error: 'Sahi Gmail address likhein (wahi jis se sign-in karte hain).' });
  if (!plan) return json(res, 400, { error: 'Plan select karein.' });

  const base = siteUrl(req);
  const orderId = randomId('VUP');

  try {
    const { id, provider } = activeProvider();
    const checkout = await provider.createCheckout({
      orderId,
      amountPkr: plan.price,
      description: `VU Prime ${plan.label}`,
      email,
      planId: plan.id,
      returnUrl:
        id === 'jazzcash'
          ? `${base}/api/callback/jazzcash`
          : `${base}/api/webhook/safepay?redirect=1&order_id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}&plan=${encodeURIComponent(plan.id)}`,
      cancelUrl: `${base}/?cancelled=1`,
    });

    return json(res, 200, {
      order_id: orderId,
      provider: id,
      amount: plan.price,
      plan: plan.id,
      email,
      checkout,
    });
  } catch (err) {
    console.error('create-payment failed:', err);
    return json(res, 500, {
      error: 'Payment shuru nahi ho saki. Thori der baad koshish karein ya bank transfer option use karein.',
    });
  }
}
