import express from 'express';
import dotenv from 'dotenv';
import {
  getOrCreateUser,
  getUser,
  recordAdView,
  completeTask,
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus,
  getConfig,
  updateConfig,
  getAllUsers,
  getAdminStats,
  saveUser,
} from './storage';
import { handleTelegramUpdate, sendTelegramMessage, notifyAdmin } from './bot';
import { getSupabase, getSupabaseSQLSetup } from './supabase';
import { getFirestoreDB } from './firebase';

dotenv.config();

export function createExpressApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-key');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      firestore: Boolean(getFirestoreDB()),
      supabase: Boolean(getSupabase()),
      bot_configured: Boolean(getConfig().bot_token || process.env.TELEGRAM_BOT_TOKEN),
    });
  });

  // Get or initialize user profile
  app.post('/api/user', async (req, res) => {
    try {
      const { userId, username, firstName, referrerId } = req.body;
      const cleanUserId = userId ? String(userId) : '1979711369';
      const user = await getOrCreateUser(cleanUserId, username, firstName, referrerId);
      const config = getConfig();

      res.json({
        user,
        config: {
          ...config,
          bot_token: config.bot_token ? '******' : '',
        },
      });
    } catch (err: any) {
      console.error('Error in /api/user:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  // Watch Ad & Earn Reward
  app.post('/api/ads/reward', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await recordAdView(String(userId));
      const config = getConfig();

      // If user reached milestone, trigger Telegram notification
      if (result.justUnlocked) {
        const user = await getUser(String(userId));
        const username = user?.username ? `@${user.username}` : user?.first_name || 'User';

        // Notify user via Bot
        await sendTelegramMessage(
          String(userId),
          `🎉 <b>CONGRATULATIONS ${username}!</b>\n\n` +
          `You have successfully watched <b>10 Ads</b> on PayPlus!\n` +
          `You have earned <b>$${result.newBalance.toFixed(2)}</b> and your access to the <b>Private VIP Channel</b> has been automatically approved!\n\n` +
          `⭐ <b>Join Now:</b> <a href="${config.premium_channel_link}">Click here to Join VIP Channel</a>`,
          {
            inline_keyboard: [
              [{ text: '⭐ Join Private VIP Channel', url: config.premium_channel_link }]
            ]
          }
        );

        // Notify Admin @paulallen
        await notifyAdmin(
          `🚀 <b>New VIP Member Unlocked!</b>\n` +
          `• User: ${username} (ID: ${userId})\n` +
          `• Total Ads: ${result.adsWatched}\n` +
          `• Balance: $${result.newBalance.toFixed(2)}\n` +
          `• Status: Auto-Approved for Private VIP Channel!`
        );
      }

      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/ads/reward:', err);
      res.status(500).json({ error: err.message || 'Failed to reward ad' });
    }
  });

  // Monetag S2S Postback webhook
  app.get('/api/monetag/postback', async (req, res) => {
    try {
      const userId = req.query.user_id || req.query.subid || req.query.ymid;
      if (userId) {
        const result = await recordAdView(String(userId));
        console.log(`Monetag postback received for user ${userId}:`, result);
        return res.send('OK');
      }
      res.status(400).send('Missing user_id parameter');
    } catch (err) {
      console.error('Monetag postback error:', err);
      res.status(500).send('Error');
    }
  });

  // Complete Social Tasks
  app.post('/api/tasks/complete', async (req, res) => {
    try {
      const { userId, taskId } = req.body;
      if (!userId || !taskId) {
        return res.status(400).json({ error: 'userId and taskId are required' });
      }
      const result = await completeTask(String(userId), String(taskId));
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/tasks/complete:', err);
      res.status(500).json({ error: err.message || 'Failed to complete task' });
    }
  });

  // Submit Withdrawal Request
  app.post('/api/withdraw', async (req, res) => {
    try {
      const { userId, amount, method, walletAddress } = req.body;
      if (!userId || !amount || !method || !walletAddress) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
      }

      const result = await createWithdrawal(String(userId), numAmount, method, walletAddress);

      // Notify admin @paulallen
      const user = await getUser(String(userId));
      await notifyAdmin(
        `💸 <b>New Withdrawal Request!</b>\n` +
        `• User: @${user?.username || 'user'} (ID: ${userId})\n` +
        `• Amount: <b>$${numAmount.toFixed(2)}</b>\n` +
        `• Method: ${method}\n` +
        `• Wallet/Account: <code>${walletAddress}</code>\n` +
        `• Request ID: ${result.withdrawal.id}`
      );

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Withdrawal failed' });
    }
  });

  // Get user withdrawal history
  app.get('/api/withdraw/history', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json([]);
    const items = getUserWithdrawals(String(userId));
    res.json(items);
  });

  // ==========================================
  // ADMIN APIS (Exclusively for @paulallen)
  // ==========================================

  const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const config = getConfig();
    const adminUsername = (config.admin_username || 'paulallen').toLowerCase().replace('@', '');
    const userHeader = req.headers['x-admin-user'] ? String(req.headers['x-admin-user']).toLowerCase().replace('@', '') : '';
    const key = req.headers['x-admin-key'] ? String(req.headers['x-admin-key']) : '';
    const secretKey = process.env.ADMIN_SECRET_KEY || 'paulallen-admin';

    // Allow if authenticated with admin key or username matches @paulallen
    if (
      key === secretKey ||
      key === 'paulallen-admin' ||
      userHeader === adminUsername ||
      userHeader === 'paulallen' ||
      userHeader === 'paulallens' ||
      req.query.admin === adminUsername
    ) {
      return next();
    }
    return res.status(403).json({ error: 'Unauthorized: Admin access restricted to @paulallen' });
  };

  app.get('/api/admin/dashboard', adminAuthMiddleware, (req, res) => {
    try {
      const stats = getAdminStats();
      const users = getAllUsers();
      const withdrawals = getAllWithdrawals();
      const config = getConfig();
      const supabaseConnected = Boolean(getSupabase());
      const firestoreConnected = Boolean(getFirestoreDB());

      res.json({
        stats,
        users,
        withdrawals,
        config,
        supabaseConnected,
        firestoreConnected,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/config', adminAuthMiddleware, async (req, res) => {
    try {
      const newConfig = req.body;
      const updated = await updateConfig(newConfig);
      res.json({ success: true, config: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/update', adminAuthMiddleware, async (req, res) => {
    try {
      const { userId, updates } = req.body;
      const user = await getUser(String(userId));
      if (!user) return res.status(404).json({ error: 'User not found' });

      const updatedUser = { ...user, ...updates };
      await saveUser(updatedUser);

      res.json(updatedUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/withdrawals/status', adminAuthMiddleware, async (req, res) => {
    try {
      const { withdrawalId, status, note } = req.body;
      const item = await updateWithdrawalStatus(withdrawalId, status, note);

      // Send telegram update to user
      await sendTelegramMessage(
        item.user_id,
        `💳 <b>Withdrawal Status Update</b>\n\n` +
        `Your request of <b>$${item.amount.toFixed(2)}</b> via <b>${item.method}</b> has been updated to: <b>${status.toUpperCase()}</b>.\n` +
        (note ? `Note: ${note}` : '')
      );

      res.json({ success: true, withdrawal: item });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Supabase SQL export endpoint
  app.get('/api/supabase/sql', (req, res) => {
    res.type('text/plain').send(getSupabaseSQLSetup());
  });

  // Telegram Bot Webhook endpoint
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      if (update) {
        await handleTelegramUpdate(update);
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Telegram webhook error:', err);
      res.sendStatus(200);
    }
  });

  return app;
}
