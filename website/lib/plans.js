// VU Prime — plan definitions.
// Prices PKR mein hain aur env vars se override ho sakti hain (dashboard redeploy ke baghair
// change karne ke liye Vercel env update karein).

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const PLANS = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    labelUr: 'Maheena war',
    days: num(process.env.PLAN_MONTHLY_DAYS, 30),
    price: num(process.env.PLAN_MONTHLY_PRICE, 1000),
    tagline: '1 maheene ke liye pura access',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    labelUr: 'Saal war',
    days: num(process.env.PLAN_YEARLY_DAYS, 365),
    price: num(process.env.PLAN_YEARLY_PRICE, 8000),
    tagline: '12 maheene — 2 maheene free',
  },
  lifetime: {
    id: 'lifetime',
    label: 'Lifetime',
    labelUr: 'Hamesha ke liye',
    days: null, // null = kabhi expire nahi hota
    price: num(process.env.PLAN_LIFETIME_PRICE, 20000),
    tagline: 'Ek dafa payment, hamesha ke liye',
  },
};

export const CURRENCY = process.env.CURRENCY || 'PKR';

export function getPlan(id) {
  if (typeof id !== 'string') return null;
  return PLANS[id.toLowerCase()] || null;
}

export function publicPlans() {
  return Object.values(PLANS).map((p) => ({
    id: p.id,
    label: p.label,
    labelUr: p.labelUr,
    days: p.days,
    price: p.price,
    currency: CURRENCY,
    tagline: p.tagline,
  }));
}
