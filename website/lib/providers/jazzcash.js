// JazzCash Hosted Checkout (HTTP POST + HMAC-SHA256 secure hash).
// Paisa seedha aapke JazzCash merchant account mein aata hai aur wahan se aapke
// bank account mein settle hota hai (settlement cycle JazzCash agreement ke mutabiq).

import crypto from 'node:crypto';

const LIVE_URL =
  'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
const SANDBOX_URL =
  'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

function env() {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const salt = process.env.JAZZCASH_INTEGRITY_SALT;
  const live = String(process.env.JAZZCASH_LIVE || 'false') === 'true';
  if (!merchantId || !password || !salt) {
    throw new Error('JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT missing');
  }
  return {
    merchantId,
    password,
    salt,
    postUrl: process.env.JAZZCASH_POST_URL || (live ? LIVE_URL : SANDBOX_URL),
  };
}

function stamp(date) {
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

/**
 * JazzCash secure hash: saare non-empty pp_* / ppmpf_* fields ko key ke hisaab se
 * ascending sort karo, values ko '&' se jodo, aage integrity salt lagao,
 * phir salt ko key bana kar HMAC-SHA256 (uppercase hex).
 */
export function secureHash(fields, salt) {
  const keys = Object.keys(fields)
    .filter((k) => k !== 'pp_SecureHash')
    .filter((k) => fields[k] !== undefined && fields[k] !== null && String(fields[k]).length > 0)
    .sort();
  const message = `${salt}&${keys.map((k) => String(fields[k])).join('&')}`;
  return crypto.createHmac('sha256', salt).update(message, 'utf8').digest('hex').toUpperCase();
}

/**
 * Checkout ke liye form fields banata hai. Frontend inhe auto-submit form ke zariye
 * JazzCash par POST karta hai.
 */
export function createCheckout({ orderId, amountPkr, description, returnUrl, email, planId }) {
  const { merchantId, password, salt, postUrl } = env();
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 ghanta

  const fields = {
    pp_Version: '1.1',
    pp_TxnType: '',
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_SubMerchantID: '',
    pp_Password: password,
    pp_BankID: '',
    pp_ProductID: '',
    pp_TxnRefNo: orderId,
    // JazzCash amount paisa mein leta hai — 1000 PKR = 100000.
    pp_Amount: String(Math.round(amountPkr * 100)),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: stamp(now),
    pp_BillReference: orderId,
    pp_Description: description,
    pp_TxnExpiryDateTime: stamp(expiry),
    pp_ReturnURL: returnUrl,
    ppmpf_1: email,
    ppmpf_2: planId,
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: '',
  };

  fields.pp_SecureHash = secureHash(fields, salt);
  return { type: 'form_post', url: postUrl, fields };
}

/** JazzCash return/IPN payload verify karta hai. */
export function verifyCallback(payload) {
  const { salt } = env();
  const received = String(payload.pp_SecureHash || '').toUpperCase();
  const expected = secureHash(payload, salt);
  const signatureOk =
    received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));

  const code = String(payload.pp_ResponseCode || '');
  return {
    signatureOk,
    // '000' = success, '121' = success (kuch channels par), baqi sab fail/pending.
    paid: signatureOk && (code === '000' || code === '121'),
    orderId: payload.pp_TxnRefNo || null,
    email: payload.ppmpf_1 || null,
    planId: payload.ppmpf_2 || null,
    amountPkr: payload.pp_Amount ? Number(payload.pp_Amount) / 100 : null,
    responseCode: code,
    responseMessage: payload.pp_ResponseMessage || '',
  };
}
