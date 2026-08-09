// Manual activation — jab koi bank transfer / Easypaisa se paisa bhejay aur aap
// screenshot verify kar ke khud activate karna chahein.
// Protection: ADMIN_TOKEN header. Token sirf aap ke paas rehna chahiye.

import { activateUser, lookupUser } from '../../lib/activation.js';
import { getPlan } from '../../lib/plans.js';
import { json, normalizeEmail, readJsonBody, timingSafeEqual, randomId } from '../../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return json(res, 500, { error: 'ADMIN_TOKEN set nahi hai' });

  const supplied =
    req.headers['x-admin-token'] ||
    (String(req.headers.authorization || '').startsWith('Bearer ')
      ? String(req.headers.authorization).slice(7)
      : '');

  if (!supplied || !timingSafeEqual(supplied, expected)) {
    return json(res, 401, { error: 'Ghalat admin token' });
  }

  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const plan = getPlan(body.plan);
  if (!email) return json(res, 400, { error: 'Sahi email dein' });
  if (!plan) return json(res, 400, { error: 'Plan monthly / yearly / lifetime hona chahiye' });

  try {
    const activation = await activateUser({
      email,
      planId: plan.id,
      orderId: body.reference ? `MANUAL-${body.reference}` : randomId('MANUAL'),
      note: body.reference ? `manual:${String(body.reference).slice(0, 60)}` : 'manual',
    });
    const status = await lookupUser(email);
    return json(res, 200, { ok: true, ...activation, status });
  } catch (err) {
    console.error('manual activation failed:', err);
    return json(res, 500, { error: err.message || 'Activation fail ho gayi' });
  }
}
