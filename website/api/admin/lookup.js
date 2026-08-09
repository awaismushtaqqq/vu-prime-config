// Admin panel ke liye: kisi email ka status dekhna (token protected).

import { lookupUser } from '../../lib/activation.js';
import { json, normalizeEmail, timingSafeEqual } from '../../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

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

  const email = normalizeEmail((req.query && req.query.email) || '');
  if (!email) return json(res, 400, { error: 'Email chahiye' });

  try {
    return json(res, 200, { email, ...(await lookupUser(email)) });
  } catch (err) {
    console.error('admin lookup failed:', err);
    return json(res, 500, { error: 'Lookup fail' });
  }
}
