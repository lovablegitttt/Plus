import { UserProfile, AdRewardConfig, WithdrawalRequest, AdminStats } from '../types';

const API_BASE = '/api';

export async function fetchUser(userId: string, username?: string, firstName?: string, referrerId?: string): Promise<{ user: UserProfile; config: AdRewardConfig }> {
  const res = await fetch(`${API_BASE}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      username,
      firstName,
      referrerId
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`);
  }
  return res.json();
}

export async function recordAdWatched(userId: string): Promise<{
  success: boolean;
  rewardEarned: number;
  newBalance: number;
  adsWatched: number;
  channelUnlocked: boolean;
  channelLink?: string;
  justUnlocked?: boolean;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/ads/reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record ad reward');
  }
  return res.json();
}

export async function completeTaskApi(userId: string, taskId: string): Promise<{
  success: boolean;
  rewardEarned: number;
  newBalance: number;
  tasksCompleted: Record<string, boolean>;
}> {
  const res = await fetch(`${API_BASE}/tasks/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to complete task');
  }
  return res.json();
}

export async function submitWithdrawalApi(userId: string, amount: number, method: string, walletAddress: string): Promise<{
  success: boolean;
  withdrawal: WithdrawalRequest;
  newBalance: number;
}> {
  const res = await fetch(`${API_BASE}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, method, walletAddress })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit withdrawal');
  }
  return res.json();
}

export async function fetchWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  const res = await fetch(`${API_BASE}/withdraw/history?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAdminData(adminKey?: string): Promise<{
  stats: AdminStats;
  users: UserProfile[];
  withdrawals: WithdrawalRequest[];
  config: AdRewardConfig;
  supabaseConnected: boolean;
  firestoreConnected?: boolean;
}> {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: {
      'x-admin-key': adminKey || 'paulallens-admin'
    }
  });
  if (!res.ok) {
    throw new Error('Admin authorization failed');
  }
  return res.json();
}

export async function updateAdminConfig(config: Partial<AdRewardConfig>, adminKey?: string): Promise<{ success: boolean; config: AdRewardConfig }> {
  const res = await fetch(`${API_BASE}/admin/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey || 'paulallens-admin'
    },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    throw new Error('Failed to update admin config');
  }
  return res.json();
}

export async function adminUpdateUser(userId: string, updates: Partial<UserProfile>, adminKey?: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/admin/users/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey || 'paulallens-admin'
    },
    body: JSON.stringify({ userId, updates })
  });
  if (!res.ok) {
    throw new Error('Failed to update user');
  }
  return res.json();
}

export async function adminHandleWithdrawal(withdrawalId: string, status: 'approved' | 'paid' | 'rejected', note?: string, adminKey?: string) {
  const res = await fetch(`${API_BASE}/admin/withdrawals/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey || 'paulallens-admin'
    },
    body: JSON.stringify({ withdrawalId, status, note })
  });
  if (!res.ok) {
    throw new Error('Failed to update withdrawal status');
  }
  return res.json();
}
