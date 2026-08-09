// Payment confirm hone par user ko config.json mein premium bana deta hai.

import { updateJsonFile, readConfig, configPath, ordersPath, readJsonFile } from './github.js';
import { getPlan } from './plans.js';
import { addDays, toDateString, parseDateString, normalizeEmail } from './util.js';

/**
 * Naya expiry nikalta hai. Agar user ka existing subscription abhi zinda hai to
 * usi ke upar din add hote hain (renewal user ka bacha hua time nahi khata).
 */
function nextExpiry(existingExpiry, days) {
  const now = new Date();
  const current = parseDateString(existingExpiry);
  const base = current && current > now ? current : now;
  return toDateString(addDays(days, base));
}

/**
 * Order ko idempotent banata hai: har order id sirf ek baar activate hota hai,
 * chahe gateway webhook 3 baar bheje. Sirf opaque order id store hoti hai — koi email nahi,
 * kyunke yeh file public repo mein hai.
 */
async function claimOrder(orderId) {
  const path = ordersPath();
  let alreadyDone = false;
  await updateJsonFile(
    path,
    (data) => {
      const doc = data && typeof data === 'object' ? data : {};
      const list = Array.isArray(doc.processed) ? doc.processed : [];
      if (list.includes(orderId)) {
        alreadyDone = true;
        return false;
      }
      // Sirf aakhri 2000 orders rakho — file chhoti rahe.
      const processed = [...list, orderId].slice(-2000);
      return { ...doc, processed, updated_at: new Date().toISOString() };
    },
    `Record order ${orderId}`
  );
  return !alreadyDone;
}

export async function isOrderProcessed(orderId) {
  const { data } = await readJsonFile(ordersPath());
  const list = data && Array.isArray(data.processed) ? data.processed : [];
  return list.includes(orderId);
}

/**
 * Main entry point. Payment verify hone ke baad call karein.
 * @returns {{ activated: boolean, duplicate?: boolean, email: string, plan: string, expires: string|null }}
 */
export async function activateUser({ email, planId, orderId, note }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) throw new Error('Email valid nahi hai');
  const plan = getPlan(planId);
  if (!plan) throw new Error('Plan valid nahi hai');

  if (orderId) {
    const claimed = await claimOrder(orderId);
    if (!claimed) {
      const current = await lookupUser(cleanEmail);
      return {
        activated: true,
        duplicate: true,
        email: cleanEmail,
        plan: planId,
        expires: current.expires,
      };
    }
  }

  let expires = null;

  await updateJsonFile(
    configPath(),
    (data) => {
      if (!data || typeof data !== 'object') throw new Error('config.json parh nahi saka');
      const next = { ...data };

      if (plan.days === null) {
        // Lifetime — premium_emails array (no expiry).
        const emails = Array.isArray(next.premium_emails) ? [...next.premium_emails] : [];
        if (!emails.includes(cleanEmail)) emails.push(cleanEmail);
        next.premium_emails = emails;
        // Agar pehle time-based tha to wahan se hata do.
        if (next.premium_users && next.premium_users[cleanEmail]) {
          const users = { ...next.premium_users };
          delete users[cleanEmail];
          next.premium_users = users;
        }
        expires = null;
      } else {
        const users = { ...(next.premium_users || {}) };
        // Lifetime user ko downgrade mat karo.
        if (Array.isArray(next.premium_emails) && next.premium_emails.includes(cleanEmail)) {
          expires = null;
          return false;
        }
        const existing = users[cleanEmail];
        expires = nextExpiry(existing && existing.expires, plan.days);
        users[cleanEmail] = { expires, plan: plan.id, ...(note ? { note } : {}) };
        next.premium_users = users;
      }

      // Ban list mein ho to payment ke baad bhi block hi rehna chahiye — usay chhero mat.
      return next;
    },
    `Activate ${plan.id} subscription${orderId ? ` (order ${orderId})` : ''}`
  );

  return { activated: true, email: cleanEmail, plan: plan.id, expires };
}

/** Kisi email ka current premium status batata hai (success page polling ke liye). */
export async function lookupUser(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return { premium: false, expires: null, plan: null, banned: false };
  const { data } = await readConfig();
  if (!data) return { premium: false, expires: null, plan: null, banned: false };

  const banned = Array.isArray(data.banned_emails)
    ? data.banned_emails.map((e) => String(e).toLowerCase()).includes(cleanEmail)
    : false;

  if (Array.isArray(data.premium_emails) && data.premium_emails.map((e) => String(e).toLowerCase()).includes(cleanEmail)) {
    return { premium: !banned, expires: null, plan: 'lifetime', banned };
  }

  const entry = data.premium_users && data.premium_users[cleanEmail];
  if (entry && entry.expires) {
    const exp = parseDateString(entry.expires);
    const active = exp ? exp.getTime() >= Date.now() : false;
    return { premium: active && !banned, expires: entry.expires, plan: entry.plan || null, banned };
  }

  return { premium: false, expires: null, plan: null, banned };
}
