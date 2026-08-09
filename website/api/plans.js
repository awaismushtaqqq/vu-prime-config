import { publicPlans } from '../lib/plans.js';
import { bankDetails, activeProvider } from '../lib/providers/index.js';
import { json } from '../lib/util.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  let provider = null;
  try {
    provider = activeProvider().id;
  } catch {
    provider = null; // gateway configure nahi hua — sirf manual bank transfer dikhega
  }
  return json(res, 200, {
    plans: publicPlans(),
    provider,
    bank: bankDetails(),
    support_whatsapp: process.env.SUPPORT_WHATSAPP || null,
  });
}
