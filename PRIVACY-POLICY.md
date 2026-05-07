# VU Prime — Privacy Policy

**Last Updated**: May 2026
**Owner**: Awais Mushtaq
**Contact**: +92 346 0306869 (WhatsApp) 

VU Prime ("the Extension") respects your privacy. This policy describes what information the Extension collects, why, and how it is used.

---

## 1. What the Extension Does

VU Prime is a productivity tool that automates fee challan marking on Virtual University of Pakistan's campus portal (`campus.vu.edu.pk`). It is designed for VU staff who manually process large numbers of paid student challans.

---

## 2. Information We Collect

The Extension collects the **minimum information required** to operate:

### 2.1 From Google Sign-In (OAuth)
When you sign in with Google, we receive (with your consent):
- **Email address** — used as your unique account identifier
- **Display name** — shown in the account drawer
- **Profile picture URL** — shown as your avatar

We do **not** access, store, or transmit:
- Your Gmail messages
- Your Google Drive files
- Your Google contacts
- Any other Google service data

### 2.2 Usage Telemetry
The Extension sends anonymous usage events to help us improve the product and detect abuse:
- Login/logout timestamps
- Heartbeat pings (every 5 minutes while signed in)
- Number of challans extracted/marked
- Extension version and a per-installation device ID (random UUID, not a hardware fingerprint)
- Plan tier (free/premium) and access verification result

These events do **not** include challan content, student data from VU Portal, payment details, or any sensitive information.

### 2.3 What We Do NOT Collect
We do **not** collect, store, or transmit:
- Your VU Portal credentials (LMS username/password)
- Student records, marks, or personal information from the VU Portal
- Browsing history outside VU Portal
- Form inputs other than student IDs you explicitly upload via CSV
- Keystrokes, screenshots, or screen recordings

---

## 3. How Information Is Used

The information collected is used **only** for:
1. **Authentication** — to verify your identity for premium features
2. **License enforcement** — to validate active premium subscriptions
3. **Service health** — to detect bugs, abuse, and outages
4. **Aggregate analytics** — to understand how many users are active

We do **not** sell, rent, or share your data with third parties for advertising or marketing purposes.

---

## 4. Data Storage

- Authentication tokens and session data are stored locally on your device using Chrome's `chrome.storage.local` API.
- Telemetry events are stored in a Google Sheets spreadsheet owned by the developer, accessible only to the developer and their authorized administrators.
- We retain telemetry data for up to **24 months**, after which it is permanently deleted.

---

## 5. Data Sharing

We share data only:
- **With Google**, solely as part of the OAuth sign-in flow (subject to Google's Privacy Policy)
- **With law enforcement**, only when legally compelled by valid court order
- **Never** with advertisers, data brokers, or any third party for commercial purposes

---

## 6. Your Rights

You have the right to:
- **Access** — request a copy of telemetry data linked to your email
- **Delete** — request deletion of your telemetry data
- **Sign out** — clear all locally stored data via the "Sign out" button in the Extension
- **Uninstall** — uninstalling the Extension removes all local data; telemetry on our servers can be deleted upon request

To exercise these rights, contact us via WhatsApp (+92 346 0306869) or email.

---

## 7. Security

- All network requests use **HTTPS encryption**
- Authentication uses **Google OAuth 2.0** (industry standard)
- Premium expiry checks use **server-authoritative time** to prevent tampering
- The Extension itself is signed by the Chrome Web Store

---

## 8. Permissions Justification

The Extension requests these Chrome permissions, each for a specific purpose:

| Permission | Why we need it |
|---|---|
| `storage` | To save your session and preferences locally |
| `tabs` | To open the VU Portal pages programmatically during automation |
| `scripting` | To inject the automation script into VU Portal pages |
| `alarms` | To run the heartbeat health check every 5 minutes |
| `identity` | To enable Google Sign-In |
| `host_permissions: campus.vu.edu.pk` | The Extension only operates on the VU Portal |
| `host_permissions: googleapis.com` | For Google OAuth |
| `host_permissions: raw.githubusercontent.com` | To fetch the live config (kill-switch, premium list) |
| `host_permissions: worldtimeapi.org` | Fallback time source for anti-tampering |

---

## 9. Children's Privacy

The Extension is intended for use by VU staff and adult students. We do not knowingly collect data from children under 13. If we learn that we have, we will delete it immediately.

---

## 10. Changes to This Policy

We may update this policy from time to time. Material changes will be communicated via the Extension's announcement banner or the project's GitHub repository. Continued use of the Extension after changes constitutes acceptance.

---

## 11. Contact

For privacy questions, data deletion requests, or any other concerns:

- **WhatsApp**: +92 346 0306869
- **Account Name**: Awais Mushtaq

---

*This Extension is an independent third-party tool and is not affiliated with, endorsed by, or associated with Virtual University of Pakistan.*
