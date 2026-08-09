# VU Prime — Payment Website

Yeh website 3 kaam karti hai:

1. User se plan (monthly/yearly/lifetime) aur uski Gmail leti hai.
2. Payment gateway (JazzCash ya Safepay) par bhejti hai — paisa **seedha aapke bank
   account mein** jata hai (gateway ke settlement schedule ke mutabiq, koi middleman nahi).
3. Payment confirm hote hi `config.json` (isi repo) mein us email ko `premium_users` mein
   likh deti hai — extension khud 5 minute ke andar isay utha kar premium on kar deta hai.
   **Yeh hi "activation" hai** — koi extra step nahi.

## Kaise chalti hai (architecture)

```
Browser (index.html)
   │  1. POST /api/create-payment  { email, plan }
   ▼
Vercel Serverless Function
   │  2. JazzCash/Safepay se checkout session banata hai
   ▼
User payment gateway par card/JazzCash/Easypaisa se pay karta hai
   │
   ▼
Gateway → /api/callback/jazzcash  ya  /api/webhook/safepay
   │  3. Signature verify karta hai (fake request block)
   │  4. GitHub Contents API se config.json parh kar
   │     premium_users[email] = { expires, plan } likh deta hai
   ▼
success.html → /api/status ko poll karta hai jab tak premium=true na ho
```

Har payment ka `order_id` `processed-orders.json` mein save hota hai taake gateway
retry/duplicate webhook bheje to dobara activation/renewal na ho.

## Setup — 15 minute mein live

### 1. GitHub token banayein (config.json likhne ke liye)

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new.
2. Repository access: sirf `vu-prime-config` select karein.
3. Permissions: **Contents → Read and write**.
4. Token copy kar lein — yeh `GH_TOKEN` hai.

### 2. Payment gateway account banayein

Pakistan mein **individual/sole-proprietor bhi seedha bank settlement** le sakta hai. Do options:

- **JazzCash Merchant Account** (recommended, sabse aam): https://www.jazzcash.com.pk/business/
  CNIC + bank account ke saath apply karein. Approve hone par `Merchant ID`, `Password`,
  aur `Integrity Salt` milte hain.
- **Safepay** (cards + wallets, developer-friendly dashboard): https://getsafepay.com
  Sign up karein, API key aur webhook secret dashboard se milega.

Dono mein **settlement seedha aapke diye gaye bank account mein** hota hai — gateway
sirf payment process karta hai, paisa apne paas nahi rakhta.

### 3. Environment variables set karein

`.env.example` ko copy karein aur values bharein:

```bash
cp .env.example .env
```

Phir Vercel deploy karte waqt yeh sab **Vercel Dashboard → Settings → Environment
Variables** mein daalne hain (`.env` file khud deploy nahi hoti, sirf local reference hai).

Zaroori variables:

| Variable | Kya hai |
|---|---|
| `GH_TOKEN`, `GH_OWNER`, `GH_REPO` | GitHub token aur repo (config.json likhne ke liye) |
| `PAYMENT_PROVIDER` | `jazzcash` ya `safepay` |
| `JAZZCASH_MERCHANT_ID/PASSWORD/INTEGRITY_SALT` | JazzCash se milte hain |
| `SITE_URL` | Aapki live site ka URL (deploy ke baad set karein) |
| `ADMIN_TOKEN` | Lamba random string — `/admin.html` ka password |

### 4. Deploy (Vercel — sabse aasan, free)

```bash
npm i -g vercel
cd website
vercel
```

Deploy hone ke baad:

1. Vercel dashboard mein `SITE_URL` env var ko apne asli domain se update karein.
2. JazzCash merchant dashboard mein **Return URL** whitelist karein:
   `https://your-domain.com/api/callback/jazzcash`
3. Safepay use kar rahe hain to dashboard mein webhook URL set karein:
   `https://your-domain.com/api/webhook/safepay`

### 5. Test karein

- Sandbox mode mein (`JAZZCASH_LIVE=false` / `SAFEPAY_LIVE=false`) ek test payment
  karein, `success.html` par activation confirm hone tak dekhein.
- `config.json` mein commit history check karein — "Activate monthly subscription…"
  jaisa commit dikhna chahiye.
- Jab tasalli ho jaye, `*_LIVE=true` kar ke real payments shuru karein.

## Manual activation (bank transfer)

Agar koi seedha bank/Easypaisa transfer kare, `/admin.html` par ja kar (apna
`ADMIN_TOKEN` daal kar) uski email + plan daal kar activate kar dein — same
`config.json` update hota hai.

## Files

- `public/` — static frontend (index, success, failed, admin)
- `api/` — Vercel serverless functions (payment, callback, webhook, status, admin)
- `lib/` — shared logic (plans, GitHub write, activation, provider adapters)
- `lib/providers/` — JazzCash aur Safepay ke alag adapters; naya gateway add karna ho
  to yahan nayi file banayein aur `lib/providers/index.js` mein register karein.

## Security notes

- Webhook/callback hamesha **signature verify** karte hain — koi bhi random POST
  request activation trigger nahi kar sakti.
- Amount tampering check hai — jo price server ne bheji thi wahi wapas match honi chahiye.
- `processed-orders.json` se duplicate webhook dobara activate/renew nahi karta.
- `/admin.html` aur `/api/admin/*` token-protected hain — `ADMIN_TOKEN` kabhi share na karein.
- `GH_TOKEN` sirf isi repo ke Contents scope tak mehdood rakhein.
