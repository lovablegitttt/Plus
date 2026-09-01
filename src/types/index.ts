export interface UserProfile {
  id: string; // telegram user id string
  username: string;
  first_name: string;
  last_name?: string;
  avatar_url?: string;
  balance: number;
  total_earned: number;
  ads_watched: number;
  ads_watched_today: number;
  last_ad_date: string;
  channel_unlocked: boolean;
  channel_approved: boolean;
  channel_joined?: boolean;
  channel_unlocked_at?: string;
  invited_by?: string;
  friends_invited: number;
  earned_from_invites: number;
  tasks_completed: { [taskId: string]: boolean };
  created_at: string;
  is_admin?: boolean;
}

export interface AdRewardConfig {
  reward_per_ad: number; // e.g. 0.30
  ads_required_for_channel: number; // 10
  daily_ad_limit: number; // 15
  invite_reward: number; // 0.75
  min_withdrawal: number; // 10.00
  monetag_zone_id: string;
  monetag_direct_link: string;
  monetag_script_url: string;
  monetag_custom_code: string;
  premium_channel_link: string;
  premium_channel_id: string;
  admin_username: string;
  auto_approve_vip: boolean;
  bot_token?: string;
  bot_username?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  type: 'channel' | 'bot' | 'subscribe';
  reward: number;
  link: string;
  completed: boolean;
  current_progress: number;
  target_progress: number;
  subtitle: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  method: 'USDT TRC20' | 'PayPal' | 'Mobile Top-Up';
  wallet_address: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  note?: string;
}

export interface AdminStats {
  total_users: number;
  total_ads_watched: number;
  total_vip_unlocked: number;
  total_balance_held: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  active_today: number;
}
