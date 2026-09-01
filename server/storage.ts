import fs from 'fs';
import path from 'path';
import { UserProfile, AdRewardConfig, WithdrawalRequest, AdminStats } from '../src/types';
import { getSupabase } from './supabase';
import { getFirestoreDB } from './firebase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  withdrawals: WithdrawalRequest[];
  config: AdRewardConfig;
}

const DEFAULT_CONFIG: AdRewardConfig = {
  reward_per_ad: 0.30,
  ads_required_for_channel: 10,
  daily_ad_limit: 15,
  invite_reward: 0.75,
  min_withdrawal: 10.00,
  monetag_zone_id: process.env.MONETAG_ZONE_ID || '11679016',
  monetag_direct_link: process.env.MONETAG_DIRECT_LINK || '',
  monetag_script_url: process.env.MONETAG_SCRIPT_URL || '//libtl.com/sdk.js',
  monetag_custom_code: 'show_11679016',
  premium_channel_link: process.env.TELEGRAM_PREMIUM_CHANNEL_LINK || 'https://t.me/+PayPlusVIPExclusive',
  premium_channel_id: process.env.TELEGRAM_PREMIUM_CHANNEL_ID || '',
  admin_username: process.env.TELEGRAM_ADMIN_USERNAME || 'paulallen',
  auto_approve_vip: true,
  bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
  bot_username: 'Pay_Plus_Bot',
};

// Admin profile for @paulallen
const DEFAULT_ADMIN_USER: UserProfile = {
  id: process.env.TELEGRAM_ADMIN_ID || '1979711369',
  username: process.env.TELEGRAM_ADMIN_USERNAME || 'paulallen',
  first_name: 'Paul',
  last_name: 'Allen',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  balance: 0.00,
  total_earned: 0.00,
  ads_watched: 0,
  ads_watched_today: 0,
  last_ad_date: new Date().toISOString().split('T')[0],
  channel_unlocked: true,
  channel_approved: true,
  channel_joined: true,
  friends_invited: 0,
  earned_from_invites: 0.00,
  tasks_completed: {},
  created_at: new Date().toISOString(),
  is_admin: true,
};

let db: DatabaseSchema = {
  users: {
    [DEFAULT_ADMIN_USER.id]: DEFAULT_ADMIN_USER,
  },
  withdrawals: [],
  config: DEFAULT_CONFIG,
};

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export async function loadDatabase() {
  try {
    ensureDirExists(DATA_DIR);
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      db = {
        ...db,
        ...parsed,
        config: {
          ...DEFAULT_CONFIG,
          ...(parsed.config || {}),
        },
      };
      console.log(`Loaded ${Object.keys(db.users).length} users from storage.`);
    } else {
      saveDatabase();
    }

    // Sync from Firestore if available
    const firestore = getFirestoreDB();
    if (firestore) {
      try {
        const configDoc = await firestore.collection('app_settings').doc('main_config').get();
        if (configDoc.exists) {
          db.config = { ...db.config, ...configDoc.data()?.value };
        } else {
          await firestore.collection('app_settings').doc('main_config').set({
            key: 'main_config',
            value: db.config,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Firestore initial sync notice:', err);
      }
    }
  } catch (err) {
    console.error('Error loading database file:', err);
  }
}

export function saveDatabase() {
  try {
    ensureDirExists(DATA_DIR);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// Initial load
loadDatabase();

export async function getUser(userId: string): Promise<UserProfile | null> {
  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data() as UserProfile;
        db.users[userId] = data;
        return data;
      }
    } catch (e) {
      console.warn('Firestore getUser fallback:', e);
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (data && !error) {
        db.users[userId] = data as UserProfile;
        return data as UserProfile;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local db:', e);
    }
  }
  return db.users[userId] || null;
}

export async function getOrCreateUser(
  userId: string,
  username?: string,
  firstName?: string,
  referrerId?: string
): Promise<UserProfile> {
  let user = await getUser(userId);
  const today = new Date().toISOString().split('T')[0];
  const isAdmin = (
    username?.toLowerCase() === db.config.admin_username.toLowerCase() ||
    userId === process.env.TELEGRAM_ADMIN_ID ||
    userId === '1979711369'
  );

  if (!user) {
    user = {
      id: userId,
      username: username || `user_${userId}`,
      first_name: firstName || 'User',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      balance: 0.00,
      total_earned: 0.00,
      ads_watched: 0,
      ads_watched_today: 0,
      last_ad_date: today,
      channel_unlocked: false,
      channel_approved: false,
      channel_joined: false,
      invited_by: referrerId && referrerId !== userId ? referrerId : undefined,
      friends_invited: 0,
      earned_from_invites: 0.00,
      tasks_completed: {},
      created_at: new Date().toISOString(),
      is_admin: isAdmin,
    };

    // Credit referrer if exists
    if (referrerId && referrerId !== userId) {
      const referrer = await getUser(referrerId);
      if (referrer) {
        const reward = db.config.invite_reward;
        referrer.friends_invited = (referrer.friends_invited || 0) + 1;
        referrer.earned_from_invites = Number(((referrer.earned_from_invites || 0) + reward).toFixed(2));
        referrer.balance = Number(((referrer.balance || 0) + reward).toFixed(2));
        referrer.total_earned = Number(((referrer.total_earned || 0) + reward).toFixed(2));
        await saveUser(referrer);
      }
    }

    await saveUser(user);
  } else {
    // Reset daily count if new day
    if (user.last_ad_date !== today) {
      user.ads_watched_today = 0;
      user.last_ad_date = today;
      await saveUser(user);
    }
    if (isAdmin && !user.is_admin) {
      user.is_admin = true;
      await saveUser(user);
    }
  }

  return user;
}

export async function saveUser(user: UserProfile): Promise<void> {
  db.users[user.id] = user;
  saveDatabase();

  // Save to Firestore
  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      await firestore.collection('users').doc(user.id).set(user, { merge: true });
    } catch (e) {
      console.warn('Firestore saveUser error:', e);
    }
  }

  // Save to Supabase (if configured)
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('users').upsert({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name || null,
        avatar_url: user.avatar_url || null,
        balance: user.balance,
        total_earned: user.total_earned,
        ads_watched: user.ads_watched,
        ads_watched_today: user.ads_watched_today,
        last_ad_date: user.last_ad_date,
        channel_unlocked: user.channel_unlocked,
        channel_approved: user.channel_approved,
        channel_joined: user.channel_joined || false,
        channel_unlocked_at: user.channel_unlocked_at || null,
        invited_by: user.invited_by || null,
        friends_invited: user.friends_invited,
        earned_from_invites: user.earned_from_invites,
        tasks_completed: user.tasks_completed || {},
        created_at: user.created_at,
        is_admin: user.is_admin || false,
      });
    } catch (e) {
      console.warn('Supabase user upsert error:', e);
    }
  }
}

export async function recordAdView(userId: string): Promise<{
  success: boolean;
  rewardEarned: number;
  newBalance: number;
  adsWatched: number;
  channelUnlocked: boolean;
  channelLink?: string;
  justUnlocked: boolean;
}> {
  const user = await getOrCreateUser(userId);
  const reward = db.config.reward_per_ad;
  const today = new Date().toISOString().split('T')[0];

  if (user.last_ad_date !== today) {
    user.ads_watched_today = 0;
    user.last_ad_date = today;
  }

  user.ads_watched += 1;
  user.ads_watched_today += 1;
  user.balance = Number((user.balance + reward).toFixed(2));
  user.total_earned = Number((user.total_earned + reward).toFixed(2));

  let justUnlocked = false;
  // Check 10-ad requirement
  if (user.ads_watched >= db.config.ads_required_for_channel && !user.channel_unlocked) {
    user.channel_unlocked = true;
    user.channel_approved = db.config.auto_approve_vip;
    user.channel_unlocked_at = new Date().toISOString();
    justUnlocked = true;
  }

  await saveUser(user);

  // Firestore log
  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      await firestore.collection('ads_history').add({
        user_id: user.id,
        reward,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore ads_history log error:', e);
    }
  }

  // Supabase log
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('ads_history').insert({
        user_id: user.id,
        reward,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase ads_history log error:', e);
    }
  }

  return {
    success: true,
    rewardEarned: reward,
    newBalance: user.balance,
    adsWatched: user.ads_watched,
    channelUnlocked: user.channel_unlocked,
    channelLink: user.channel_unlocked ? db.config.premium_channel_link : undefined,
    justUnlocked,
  };
}

export async function completeTask(userId: string, taskId: string): Promise<{
  success: boolean;
  rewardEarned: number;
  newBalance: number;
  tasksCompleted: Record<string, boolean>;
}> {
  const user = await getOrCreateUser(userId);
  if (user.tasks_completed && user.tasks_completed[taskId]) {
    return {
      success: true,
      rewardEarned: 0,
      newBalance: user.balance,
      tasksCompleted: user.tasks_completed,
    };
  }

  const reward = 0.10;
  user.tasks_completed = {
    ...(user.tasks_completed || {}),
    [taskId]: true,
  };
  user.balance = Number((user.balance + reward).toFixed(2));
  user.total_earned = Number((user.total_earned + reward).toFixed(2));
  await saveUser(user);

  return {
    success: true,
    rewardEarned: reward,
    newBalance: user.balance,
    tasksCompleted: user.tasks_completed,
  };
}

export async function createWithdrawal(
  userId: string,
  amount: number,
  method: 'USDT TRC20' | 'PayPal' | 'Mobile Top-Up',
  walletAddress: string
): Promise<{ success: boolean; withdrawal: WithdrawalRequest; newBalance: number }> {
  const user = await getOrCreateUser(userId);
  if (user.balance < amount) {
    throw new Error('Insufficient balance');
  }
  if (amount < db.config.min_withdrawal) {
    throw new Error(`Minimum withdrawal amount is $${db.config.min_withdrawal.toFixed(2)}`);
  }

  user.balance = Number((user.balance - amount).toFixed(2));
  await saveUser(user);

  const withdrawal: WithdrawalRequest = {
    id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: user.id,
    username: user.username,
    amount,
    method,
    wallet_address: walletAddress,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  db.withdrawals.unshift(withdrawal);
  saveDatabase();

  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      await firestore.collection('withdrawals').doc(withdrawal.id).set(withdrawal);
    } catch (e) {
      console.warn('Firestore withdrawal save error:', e);
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('withdrawals').insert(withdrawal);
    } catch (e) {
      console.warn('Supabase withdrawal insert error:', e);
    }
  }

  return {
    success: true,
    withdrawal,
    newBalance: user.balance,
  };
}

export function getUserWithdrawals(userId: string): WithdrawalRequest[] {
  return db.withdrawals.filter(w => w.user_id === userId);
}

export function getAllWithdrawals(): WithdrawalRequest[] {
  return db.withdrawals;
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: 'approved' | 'paid' | 'rejected',
  note?: string
): Promise<WithdrawalRequest> {
  const item = db.withdrawals.find(w => w.id === withdrawalId);
  if (!item) {
    throw new Error('Withdrawal request not found');
  }

  // If rejected, refund user balance
  if (status === 'rejected' && item.status !== 'rejected') {
    const user = await getUser(item.user_id);
    if (user) {
      user.balance = Number((user.balance + item.amount).toFixed(2));
      await saveUser(user);
    }
  }

  item.status = status;
  if (note) item.note = note;
  saveDatabase();

  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      await firestore.collection('withdrawals').doc(withdrawalId).set({ status, note: note || null }, { merge: true });
    } catch (e) {
      console.warn('Firestore withdrawal status update error:', e);
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('withdrawals').update({ status, note }).eq('id', withdrawalId);
    } catch (e) {
      console.warn('Supabase withdrawal status update error:', e);
    }
  }

  return item;
}

export function getConfig(): AdRewardConfig {
  return db.config;
}

export async function updateConfig(newConfig: Partial<AdRewardConfig>): Promise<AdRewardConfig> {
  db.config = {
    ...db.config,
    ...newConfig,
  };
  saveDatabase();

  const firestore = getFirestoreDB();
  if (firestore) {
    try {
      await firestore.collection('app_settings').doc('main_config').set({
        key: 'main_config',
        value: db.config,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateConfig error:', e);
    }
  }

  return db.config;
}

export function getAllUsers(): UserProfile[] {
  return Object.values(db.users);
}

export function getAdminStats(): AdminStats {
  const users = Object.values(db.users);
  const today = new Date().toISOString().split('T')[0];

  const totalUsers = users.length;
  const totalAdsWatched = users.reduce((sum, u) => sum + (u.ads_watched || 0), 0);
  const totalVipUnlocked = users.filter(u => u.channel_unlocked).length;
  const totalBalanceHeld = Number(users.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2));
  const totalWithdrawn = Number(
    db.withdrawals
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + w.amount, 0)
      .toFixed(2)
  );
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'pending').length;
  const activeToday = users.filter(u => u.last_ad_date === today).length;

  return {
    total_users: totalUsers,
    total_ads_watched: totalAdsWatched,
    total_vip_unlocked: totalVipUnlocked,
    total_balance_held: totalBalanceHeld,
    total_withdrawn: totalWithdrawn,
    pending_withdrawals: pendingWithdrawals,
    active_today: activeToday,
  };
}
