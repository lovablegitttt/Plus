# 🚀 PayPlus - Telegram Mini App & Earning Bot

PayPlus is a high-yield Telegram Mini App where users watch short ads (powered by Monetag SDK), complete simple social tasks, invite friends, and unlock auto-approved access to an exclusive **Private VIP Channel** upon watching 10 ads.

---

## 🌟 Key Features

1. **Monetag Ad SDK Integration**: Real rewarded ads with Zone `11679016` (`//libtl.com/sdk.js` with `show_11679016`).
2. **VIP Milestone Auto-Unlock**: When a user watches 10 ads, the app grants instant auto-approval to your private Telegram VIP Channel and sends a celebratory bot notification.
3. **Admin Console for `@paulallen`**: Protected admin management console for adjusting reward payouts, inspecting user lists, approving withdrawals, and managing ad zones.
4. **Real Users Only**: Clean database architecture with real-time Firestore persistence and optional Supabase sync.
5. **Vercel Serverless Ready**: Native support for Vite frontend and `/api` serverless backend functions on Vercel.

---

## 🛠️ Step-by-Step Deployment to Vercel via GitHub

### Step 1: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new).
2. Initialize git and push the project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of PayPlus Telegram Mini App"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

### Step 2: Import into Vercel

1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your imported GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

### Step 3: Add Environment Variables in Vercel

In Vercel **Settings ➔ Environment Variables**, add the following variables:

| Variable Name | Value / Description | Example |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) | `7123456789:ABCdefGHIjklmn...` |
| `TELEGRAM_ADMIN_USERNAME` | Your Telegram username without `@` | `paulallen` |
| `TELEGRAM_ADMIN_ID` | Your numerical Telegram User ID | `1979711369` |
| `ADMIN_SECRET_KEY` | Secret key for admin API authentication | `paulallen-admin` |
| `TELEGRAM_PREMIUM_CHANNEL_LINK` | Invite link to your Private VIP Channel | `https://t.me/+AbCdEfGhIjKlMn` |
| `TELEGRAM_PREMIUM_CHANNEL_ID` | Numerical ID of your VIP Channel | `-1001234567890` |
| `APP_URL` | Your live Vercel URL | `https://your-payplus-app.vercel.app` |
| `MONETAG_ZONE_ID` | Monetag Zone ID | `11679016` |
| `MONETAG_SCRIPT_URL` | Monetag Script URL | `//libtl.com/sdk.js` |
| `MONETAG_CUSTOM_CODE` | Monetag function name | `show_11679016` |
| `MONETAG_DIRECT_LINK` | (Optional) Monetag Direct Link URL | `https://...` |

Click **Deploy**!

---

### Step 4: Configure Telegram Bot (@BotFather)

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Create a new bot with `/newbot` (or select your existing bot).
3. Set your bot's Mini App URL:
   - Send `/newapp` to `@BotFather`.
   - Choose your bot.
   - Set Title: `PayPlus Earning`
   - Set Description: `Watch short ads & earn cash rewards!`
   - Set App URL: `https://your-payplus-app.vercel.app`
   - Set Short Name: `app`
4. Set Webhook URL so the bot receives Telegram commands (`/start`, `/balance`, `/vip`):
   - Make a `POST` or `GET` request in your browser:
     ```
     https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://your-payplus-app.vercel.app/api/telegram/webhook
     ```

---

### Step 5: Configure VIP Channel Permissions

1. Open your **Private VIP Telegram Channel**.
2. Go to **Channel Settings ➔ Administrators ➔ Add Admin**.
3. Search for your Bot username and add it as an Administrator.
4. Grant the following permissions:
   - ✅ **Invite Users via Link**
   - ✅ **Manage Chat** (required to auto-approve join requests)

---

## 🔒 Security & Admin Access

- Only the Telegram handle `@paulallen` (or numerical ID configured in `TELEGRAM_ADMIN_ID`) has access to the Admin Console.
- Non-admin users are strictly blocked from admin routes and settings.
