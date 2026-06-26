# Kaleyra OTP Tester — India

A Next.js app to test the **Kaleyra India SMS OTP** channel using DLT-registered templates.

---

## Quick Start

### 1. Configure `.env.local`

```env
KALEYRA_API_DOMAIN=https://api.in.kaleyra.io
KALEYRA_API_KEY=your_api_key_here
KALEYRA_SID=your_account_sid_here

KALEYRA_MODE=sms
KALEYRA_SENDER_ID=SMPOTL
KALEYRA_TEMPLATE_ID=1007770635007981105
KALEYRA_OTP_BODY=Dear User, Your login OTP for RenewCred dMRV is {otp}. It is valid for 5 min. Please do not share with anyone. - Simploona
KALEYRA_OTP_LENGTH=6
KALEYRA_OTP_TTL_SECONDS=300
```

Get your **API Key** and **SID** from the Kaleyra dashboard → **API Details**.

### 2. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

| Step | What happens |
|------|-------------|
| Enter phone | 10-digit Indian mobile (6–9 prefix). Country code `+91` is added automatically. |
| Send OTP | `POST /api/send-otp` → generates a 6-digit OTP, substitutes `{otp}` in the DLT template body, calls Kaleyra `/v1/{SID}/messages` with `type=OTP`. |
| Dev hint | In development, the generated OTP is shown on screen (hidden in production). |
| Verify OTP | `POST /api/verify-otp` → checks the OTP against the in-memory store with TTL validation. |
| Success | OTP is consumed (one-time use) and the session is cleared. |

---

## API Endpoints

### `POST /api/send-otp`
```json
{ "phone": "9876543210" }
```
Response:
```json
{ "message": "OTP sent successfully.", "expiresAt": 1700000300000, "_dev_otp": "482910" }
```

### `POST /api/verify-otp`
```json
{ "phone": "9876543210", "otp": "482910" }
```
Response:
```json
{ "message": "OTP verified successfully. ✅" }
```

---

## Modes

| Mode | Description |
|------|-------------|
| `sms` (default) | Sends OTP via Kaleyra Messages API with your DLT template. OTP is validated server-side. |
| `verify` | Uses Kaleyra Verify API (requires `KALEYRA_FLOW_ID`). Switch `KALEYRA_MODE=verify` in `.env.local`. |

---

## Production Notes

- Replace the **in-memory OTP store** in `lib/kaleyra.ts` with Redis or a database for multi-instance deployments.
- Remove or gate the `_dev_otp` field — it is already suppressed when `NODE_ENV=production`.
- Rate-limit the `/api/send-otp` route to prevent abuse.
