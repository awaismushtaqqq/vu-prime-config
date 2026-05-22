# VU Prime — Privacy Policy

**Last Updated**: May 2026  
**Version**: 2.6.0  
**Owner**: Awais Mushtaq  
**Contact**: +92 346 0306869 (WhatsApp)

VU Prime ("the Extension") respects your privacy. This policy describes what information the Extension collects, why, and how it is used.

---

## 1. What the Extension Does

VU Prime is a productivity suite for Virtual University of Pakistan campus staff. It provides four integrated modules:

1. **Challan Automation** — Bulk extracts and marks paid fee challans on `campus.vu.edu.pk`
2. **VU Pro Suite** — Scrapes student data into the user's local database, provides a 360° student dashboard, search, and Excel export
3. **WhatsApp Sender** — Sends bulk educational reminder messages via `web.whatsapp.com`
4. **Community Chat** — Real-time group chat connecting verified VU Prime subscribers

The Extension is sold by subscription to verified VU campus staff.

---

## 2. Information We Collect

The Extension collects the **minimum information required** to operate.

### 2.1 From Google Sign-In (OAuth)

When you sign in with Google, we receive (with your consent):

- **Email address** — used as your unique account identifier and license key
- **Display name** — shown in the account drawer and community chat
- **Profile picture URL** — shown as your avatar

We do **not** access, store, or transmit:

- Your Gmail messages
- Your Google Drive files
- Your Google contacts, calendar, or any other Google service data

### 2.2 Authentication & License Validation Data

Sent to our authentication server (Cloudflare Workers at `vu-prime-api.vu-prime.workers.dev`):

- Your Google email (for subscription matching)
- A device fingerprint hash (SHA-256 of browser characteristics — not reversible to PII)
- A per-installation device ID (random UUID)
- Extension version
- Login/logout timestamps
- Heartbeat pings every 2 minutes while signed in (for kill-switch and subscription validation)

This data is stored in our Cloudflare D1 database (SQLite at the edge) and is used solely for license enforcement, abuse detection, and service reliability.

### 2.3 Community Chat Data

If you use the Community Chat feature:

- Your sent messages, your display name, and your campus code are stored on our server
- Messages are visible to all other authenticated VU Prime subscribers
- Admins can delete inappropriate messages or mute users who violate the chat rules
- You can stop using Chat at any time; existing messages can be deleted on request

### 2.4 Student & Automation Data (Stored Locally Only)

Student records you scrape, fee challan data you process, WhatsApp contact lists you upload, and personal notes you write — **all of this stays in your browser only**.

- Stored in `chrome.storage.local` on your device
- Never sent to our servers
- Never sent to any third party
- Cleared when you uninstall the extension

### 2.5 What We Do NOT Collect

We do **not** collect, store, or transmit:

- Your VU Portal credentials (LMS username/password)
- Student records, marks, or personal information from the VU Portal (these stay on your device)
- Browsing history outside the Extension's authorized domains
- Form inputs other than the data you explicitly choose to scrape/upload
- Keystrokes, screenshots, or screen recordings
- Payment details (subscription payments are processed off-platform via JazzCash/EasyPaisa/bank transfer)

---

## 3. How Information Is Used

The information collected is used **only** for:

1. **Authentication** — to verify your identity for premium feature access
2. **License enforcement** — to validate active premium subscriptions
3. **Abuse prevention** — to detect compromised accounts, device sharing beyond the allowed limit, and tampering
4. **Service health** — to detect bugs, crashes, and outages
5. **Community chat moderation** — to maintain a professional and safe communication environment

We do **not** sell, rent, share, or transfer your data to third parties for advertising, marketing, profiling, or any commercial purpose.

---

## 4. Data Storage & Security

### Local Storage (Your Browser)
- Authentication tokens, session data, user preferences, scraped student data, automation job state — all stored locally using Chrome's `chrome.storage.local` API
- This data never leaves your device unless you explicitly export it (e.g., to Excel via the export feature)

### Server Storage (Cloudflare)
- Our authentication backend runs on Cloudflare Workers with a Cloudflare D1 database
- Servers are located in Cloudflare's global edge network with industry-standard physical and network security
- All connections use **HTTPS encryption** (TLS 1.3)
- JWT tokens are signed with HMAC-SHA256 and rotate every 60 minutes
- We retain authentication and audit log data for up to **24 months**, after which it is permanently deleted
- Community chat messages are retained indefinitely unless deleted by the user, an admin, or as part of an account deletion request

---

## 5. Data Sharing

We share data only:

- **With Google**, solely as part of the OAuth sign-in flow (subject to Google's Privacy Policy)
- **With Cloudflare**, as our infrastructure provider (subject to Cloudflare's Privacy Policy)
- **With law enforcement**, only when legally compelled by a valid court order
- **Never** with advertisers, data brokers, or any third party for commercial purposes

---

## 6. Your Rights

You have the right to:

- **Access** — request a copy of all data linked to your email address
- **Delete** — request deletion of your account, audit logs, and chat history
- **Sign out** — clear all locally stored data via the "Sign out" button in the Extension
- **Uninstall** — uninstalling the Extension removes all local data; server-side data can be deleted upon request
- **Object** — opt out of the Community Chat by simply not using it (it does not run in the background)

To exercise these rights, contact us via WhatsApp (+92 346 0306869).

---

## 7. Security

- All network requests use **HTTPS encryption** (TLS 1.3)
- Authentication uses **Google OAuth 2.0** (industry standard)
- Session tokens (JWTs) are HMAC-SHA256 signed and expire every 60 minutes
- Device fingerprinting limits unauthorized account sharing
- Premium expiry checks use **server-authoritative time** to prevent tampering via local clock manipulation
- Server-side kill switch can revoke compromised accounts instantly
- The Extension itself is signed and distributed by the Chrome Web Store

---

## 8. Permissions Justification

The Extension requests these Chrome permissions, each for a specific purpose:

| Permission | Why we need it |
|---|---|
| `storage` | To save your session, settings, and locally-cached student data |
| `tabs` | To coordinate automation across multiple browser tabs |
| `scripting` | To inject automation content scripts into authorized pages |
| `alarms` | To run the license heartbeat check every 2 minutes |
| `identity` | To enable Google Sign-In via chrome.identity API |
| `notifications` | To alert you when long-running jobs complete |
| **Host: campus.vu.edu.pk** | Core automation runs here (challans, student scraping, 360° view) |
| **Host: web.whatsapp.com** | WhatsApp Sender module |
| **Host: vu-prime-api.vu-prime.workers.dev** | Our authentication server (license validation, chat) |
| **Host: googleapis.com** | Google OAuth profile fetch |
| **Host: worldtimeapi.org** | Fallback time source for anti-tampering |

---

## 9. Children's Privacy

The Extension is intended for use by VU staff and adult students. We do not knowingly collect data from children under 13. If we learn that we have, we will delete it immediately.

---

## 10. International Data Transfers

Our servers run on Cloudflare's global edge network, which means your data may be processed in data centers located outside Pakistan. Cloudflare is compliant with GDPR and other international data protection frameworks. By using the Extension, you consent to this transfer.

---

## 11. Changes to This Policy

We may update this policy from time to time. Material changes will be communicated via:

- The Extension's announcement banner
- A version bump in this document
- An optional WhatsApp notification for subscribers

Continued use of the Extension after changes constitutes acceptance.

---

## 12. Contact

For privacy questions, data deletion requests, or any other concerns:

- **WhatsApp**: +92 346 0306869
- **Account Name**: Awais Mushtaq

---

*This Extension is an independent third-party tool and is not affiliated with, endorsed by, or associated with Virtual University of Pakistan.*
