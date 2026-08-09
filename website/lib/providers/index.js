import * as jazzcash from './jazzcash.js';
import * as safepay from './safepay.js';

export const PROVIDERS = { jazzcash, safepay };

export function activeProvider() {
  const id = (process.env.PAYMENT_PROVIDER || 'jazzcash').toLowerCase();
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`PAYMENT_PROVIDER "${id}" support nahi karta (jazzcash | safepay)`);
  }
  return { id, provider };
}

/** Bank transfer details — manual option ke liye (gateway ke saath ya us ke baghair). */
export function bankDetails() {
  const raw = {
    bank: process.env.BANK_NAME,
    title: process.env.BANK_ACCOUNT_TITLE,
    account: process.env.BANK_ACCOUNT_NUMBER,
    iban: process.env.BANK_IBAN,
    easypaisa: process.env.EASYPAISA_NUMBER,
    jazzcash: process.env.JAZZCASH_NUMBER,
    whatsapp: process.env.SUPPORT_WHATSAPP,
  };
  const filled = Object.fromEntries(Object.entries(raw).filter(([, v]) => v));
  return Object.keys(filled).length ? filled : null;
}
