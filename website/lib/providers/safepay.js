// Safepay (getsafepay.com) — cards + JazzCash/Easypaisa/bank transfer, PKR settlement
// seedha aapke Pakistani bank account mein.
//
// NOTE: Safepay apne API endpoints kabhi kabhi update karta hai. Base URL aur checkout URL
// env vars se override ho sakte hain (SAFEPAY_API_BASE / SAFEPAY_CHECKOUT_BASE) taake
// code change kiye baghair naya endpoint lagaya ja sake. Live karne se pehle apne Safepay
// dashboard ke docs se endpoints ek dafa confirm kar lein.

import crypto from 'node:crypto';

function env() {
  const apiKey = process.env.SAFEPAY_API_KEY;
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET;
  const live = String(process.env.SAFEPAY_LIVE || 'false') === 'true';
  if (!apiKey) throw new Error('SAFEPAY_API_KEY missing');
  return {
    apiKey,
    secret,
    environment: live ? 'production' : 'sandbox',
    apiBase:
      process.env.SAFEPAY_API_BASE ||
      (live ? 'https://api.getsafepay.com' : 'https://sandbox.api.getsafepay.com'),
    checkoutBase:
      process.env.SAFEPAY_CHECKOUT_BASE ||
      (live ? 'https://getsafepay.com/checkout/pay' : 'https://sandbox.api.getsafepay.com/checkout/pay'),
  };
}

/** Safepay session banata hai aur hosted checkout ka redirect URL wapas karta hai. */
export async function createCheckout({ orderId, amountPkr, returnUrl, cancelUrl, email, planId }) {
  const { apiKey, environment, apiBase, checkoutBase } = env();

  const res = await fetch(`${apiBase}/order/v1/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client: apiKey,
      environment,
      currency: 'PKR',
      amount: Math.round(amountPkr),
      order_id: orderId,
      metadata: { order_id: orderId, plan: planId || '', email: email || '' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Safepay init failed (${res.status}): ${await res.text()}`);
  }
  const body = await res.json();
  const tracker = body?.data?.tracker?.token || body?.data?.tracker || body?.tracker;
  if (!tracker) throw new Error('Safepay ne tracker return nahi kiya');

  const url = new URL(checkoutBase);
  url.searchParams.set('tracker', tracker);
  url.searchParams.set('env', environment);
  url.searchParams.set('source', 'custom');
  url.searchParams.set('order_id', orderId);
  url.searchParams.set('redirect_url', returnUrl);
  if (cancelUrl) url.searchParams.set('cancel_url', cancelUrl);
  if (email) url.searchParams.set('user_email', email);
  if (planId) url.searchParams.set('metadata[plan]', planId);

  return { type: 'redirect', url: url.toString(), reference: tracker };
}

/** Safepay webhook signature (HMAC-SHA256 over raw body). */
export function verifyWebhook(rawBody, signatureHeader) {
  const { secret } = env();
  if (!secret) return false;
  if (!signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const received = String(signatureHeader).trim().toLowerCase();
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
