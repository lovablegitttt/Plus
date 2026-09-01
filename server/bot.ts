import { getConfig, getUser, getOrCreateUser, recordAdView } from './storage';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  const config = getConfig();
  const token = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log(`[Telegram Bot Simulation] -> To ${chatId}: ${text}`);
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return false;
  }
}

export async function approveTelegramChatJoinRequest(
  chatId: string | number,
  userId: string | number
): Promise<boolean> {
  const config = getConfig();
  const token = config.bot_token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/approveChatJoinRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    });
    const data = await res.json();
    console.log('approveChatJoinRequest response:', data);
    return data.ok === true;
  } catch (err) {
    console.error('Error approving join request:', err);
    return false;
  }
}

export async function notifyAdmin(message: string): Promise<void> {
  const config = getConfig();
  const adminId = process.env.TELEGRAM_ADMIN_ID || '1979711369';
  await sendTelegramMessage(adminId, `🔔 <b>Admin Alert (@${config.admin_username}):</b>\n\n${message}`);
}

export async function handleTelegramUpdate(update: any): Promise<void> {
  const config = getConfig();
  const appUrl = process.env.APP_URL || 'https://t.me/Pay_Plus_Bot/app';

  // 1. Handle Chat Join Request to Private VIP Channel
  if (update.chat_join_request) {
    const req = update.chat_join_request;
    const userId = String(req.from.id);
    const user = await getUser(userId);

    if (user && user.ads_watched >= config.ads_required_for_channel) {
      // Auto-approve!
      await approveTelegramChatJoinRequest(req.chat.id, req.from.id);
      await sendTelegramMessage(
        userId,
        `🎉 <b>Welcome to the Private VIP Channel!</b>\n\nYour request has been automatically approved because you reached the <b>${config.ads_required_for_channel} Ads</b> milestone on PayPlus! Enjoy exclusive content.`
      );
      if (user) {
        user.channel_joined = true;
        user.channel_approved = true;
      }
      await notifyAdmin(`User @${req.from.username || req.from.first_name} (ID: ${userId}) auto-approved for VIP Channel after watching ${user.ads_watched} ads!`);
    } else {
      // Prompt user to finish 10 ads
      const currentAds = user ? user.ads_watched : 0;
      const remaining = Math.max(0, config.ads_required_for_channel - currentAds);
      await sendTelegramMessage(
        userId,
        `🔒 <b>VIP Channel Access Locked</b>\n\nYou need <b>${config.ads_required_for_channel} watched ads</b> to join this private VIP channel. You have watched <b>${currentAds}/${config.ads_required_for_channel}</b>.\n\nWatch ${remaining} more ads to get instant free access!`,
        {
          inline_keyboard: [
            [{ text: '🚀 Open PayPlus Mini App', web_app: { url: appUrl } }],
          ],
        }
      );
    }
    return;
  }

  // 2. Handle Text Messages & /start
  if (update.message && update.message.text) {
    const msg = update.message;
    const text = msg.text.trim();
    const userId = String(msg.from.id);
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || '';

    // Check for /start with optional referrer ID (e.g. /start 1979711369)
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const referrerId = parts.length > 1 ? parts[1] : undefined;

      const user = await getOrCreateUser(userId, username, firstName, referrerId);

      const welcomeText = `👋 <b>Welcome to PayPlus, ${firstName}!</b>\n\n` +
        `💰 <b>Watch short ads & earn real money!</b>\n` +
        `💎 <b>Special Milestone:</b> Watch <b>${config.ads_required_for_channel} ads</b> to get <b>FREE access to our Private VIP Channel</b> with automatic approval!\n\n` +
        `📊 <b>Your Stats:</b>\n` +
        `• Balance: <b>$${user.balance.toFixed(2)}</b>\n` +
        `• Ads Watched: <b>${user.ads_watched}/${config.ads_required_for_channel}</b>\n` +
        `• VIP Status: <b>${user.channel_unlocked ? '✅ Unlocked & Approved' : '🔒 Locked (' + (config.ads_required_for_channel - user.ads_watched) + ' remaining)'}</b>\n\n` +
        `Click the button below to start earning right now!`;

      await sendTelegramMessage(userId, welcomeText, {
        inline_keyboard: [
          [{ text: '🚀 Open PayPlus Earning App', web_app: { url: appUrl } }],
          [
            { text: '📺 Watch Ad (+$0.30)', callback_data: 'watch_ad' },
            { text: '💎 VIP Channel Link', callback_data: 'check_vip' }
          ],
          [
            { text: '👥 Invite Friends (+$0.75)', callback_data: 'my_referral' },
            { text: '💳 Withdraw Funds', callback_data: 'withdraw' }
          ]
        ]
      });
      return;
    }

    if (text === '/balance' || text === '/stats') {
      const user = await getOrCreateUser(userId, username, firstName);
      await sendTelegramMessage(
        userId,
        `💰 <b>Your PayPlus Balance:</b>\n\n` +
        `• Available Balance: <b>$${user.balance.toFixed(2)}</b>\n` +
        `• Total Earned: <b>$${user.total_earned.toFixed(2)}</b>\n` +
        `• Ads Watched: <b>${user.ads_watched}/${config.ads_required_for_channel}</b>\n` +
        `• Friends Invited: <b>${user.friends_invited}</b>\n` +
        `• VIP Channel: <b>${user.channel_unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}</b>`,
        {
          inline_keyboard: [
            [{ text: '🚀 Open Mini App', web_app: { url: appUrl } }]
          ]
        }
      );
      return;
    }

    if (text === '/vip' || text === '/channel') {
      const user = await getOrCreateUser(userId, username, firstName);
      if (user.channel_unlocked) {
        await sendTelegramMessage(
          userId,
          `🎉 <b>Your Private VIP Channel Link is Ready!</b>\n\nClick below to join our exclusive channel:`,
          {
            inline_keyboard: [
              [{ text: '⭐ Join Private VIP Channel', url: config.premium_channel_link }]
            ]
          }
        );
      } else {
        const remaining = Math.max(0, config.ads_required_for_channel - user.ads_watched);
        await sendTelegramMessage(
          userId,
          `🔒 <b>VIP Channel Access:</b>\n\nYou have watched <b>${user.ads_watched}/${config.ads_required_for_channel}</b> ads.\nWatch <b>${remaining} more ads</b> to unlock instant auto-approved access!`,
          {
            inline_keyboard: [
              [{ text: '📺 Watch Ads on PayPlus', web_app: { url: appUrl } }]
            ]
          }
        );
      }
      return;
    }
  }

  // 3. Handle Callback Queries
  if (update.callback_query) {
    const cb = update.callback_query;
    const userId = String(cb.from.id);
    const data = cb.data;

    if (data === 'check_vip') {
      const user = await getUser(userId);
      if (user && user.channel_unlocked) {
        await sendTelegramMessage(
          userId,
          `🎉 <b>You have full VIP Access!</b>\nJoin the channel here:`,
          {
            inline_keyboard: [
              [{ text: '⭐ Join Private VIP Channel', url: config.premium_channel_link }]
            ]
          }
        );
      } else {
        const count = user ? user.ads_watched : 0;
        await sendTelegramMessage(
          userId,
          `🔒 You need 10 ads to get free VIP channel link. (Current: ${count}/10). Open the app to watch!`,
          {
            inline_keyboard: [
              [{ text: '🚀 Open App & Watch', web_app: { url: appUrl } }]
            ]
          }
        );
      }
    } else if (data === 'my_referral') {
      const botName = config.bot_username || 'Pay_Plus_Bot';
      const refLink = `https://t.me/${botName}/app?startapp=${userId}`;
      await sendTelegramMessage(
        userId,
        `👥 <b>Your Referral Link:</b>\n<code>${refLink}</code>\n\nEarn <b>$${config.invite_reward.toFixed(2)}</b> for every friend who joins!`,
        {
          inline_keyboard: [
            [{ text: '📤 Share Link', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join PayPlus to earn money watching ads and unlock VIP channel for free!')}` }]
          ]
        }
      );
    }
  }
}
