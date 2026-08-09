// Success page yahan poll karta hai: activation ho gayi ya nahi.

import { lookupUser } from '../lib/activation.js';
import { json, normalizeEmail } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const email = normalizeEmail((req.query && req.query.email) || '');
  if (!email) return json(res, 400, { error: 'Email chahiye' });

  try {
    const status = await lookupUser(email);
    return json(res, 200, { email, ...status });
  } catch (err) {
    console.error('status lookup failed:', err);
    return json(res, 500, { error: 'Status check nahi ho saka' });
  }
}
