// JazzCash user ko payment ke baad yahan POST karta hai. Yahin verify + activate hota hai,
// phir user ko success/failed page par bhej dete hain.

import { verifyCallback } from '../../lib/providers/jazzcash.js';
import { activateUser } from '../../lib/activation.js';
import { getPlan } from '../../lib/plans.js';
import { readFormBody, siteUrl } from '../../lib/util.js';

function redirect(res, url) {
  res.statusCode = 303;
  res.setHeader('Location', url);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export default async function handler(req, res) {
  const base = siteUrl(req);
  const payload = req.method === 'POST' ? await readFormBody(req) : req.query || {};

  let result;
  try {
    result = verifyCallback(payload);
  } catch (err) {
    console.error('jazzcash verify error:', err);
    return redirect(res, `${base}/failed.html?reason=config`);
  }

  if (!result.signatureOk) {
    console.warn('jazzcash callback signature mismatch', { orderId: result.orderId });
    return redirect(res, `${base}/failed.html?reason=signature`);
  }

  if (!result.paid) {
    return redirect(
      res,
      `${base}/failed.html?reason=declined&code=${encodeURIComponent(result.responseCode)}`
    );
  }

  const plan = getPlan(result.planId);
  if (!plan || !result.email) {
    console.error('jazzcash callback missing plan/email', result);
    return redirect(res, `${base}/failed.html?reason=data`);
  }

  // Amount tampering check — jo bheja tha wahi wapas aana chahiye.
  if (result.amountPkr !== null && Math.round(result.amountPkr) !== Math.round(plan.price)) {
    console.error('jazzcash amount mismatch', { expected: plan.price, got: result.amountPkr });
    return redirect(res, `${base}/failed.html?reason=amount`);
  }

  try {
    const activation = await activateUser({
      email: result.email,
      planId: plan.id,
      orderId: result.orderId,
      note: `jazzcash:${result.orderId}`,
    });
    return redirect(
      res,
      `${base}/success.html?email=${encodeURIComponent(activation.email)}&plan=${encodeURIComponent(
        activation.plan
      )}&order=${encodeURIComponent(result.orderId || '')}`
    );
  } catch (err) {
    console.error('activation failed after successful payment:', err);
    // Paisa kat chuka hai — user ko clearly batao ke support se rabta kare.
    return redirect(
      res,
      `${base}/failed.html?reason=activation&order=${encodeURIComponent(result.orderId || '')}`
    );
  }
}
