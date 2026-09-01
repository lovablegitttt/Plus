import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Users,
  DollarSign,
  Settings,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code,
  Radio,
  Sliders,
  BellRing
} from 'lucide-react';
import { UserProfile, AdRewardConfig, WithdrawalRequest, AdminStats } from '../types';
import {
  fetchAdminData,
  updateAdminConfig,
  adminUpdateUser,
  adminHandleWithdrawal,
} from '../lib/api';
import { triggerHaptic } from '../lib/telegram';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'monetag' | 'database' | 'bot'>('users');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [config, setConfig] = useState<AdRewardConfig | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable config state
  const [editConfig, setEditConfig] = useState<Partial<AdRewardConfig>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminData();
      setStats(data.stats);
      setUsers(data.users);
      setWithdrawals(data.withdrawals);
      setConfig(data.config);
      setEditConfig(data.config);
      setSupabaseConnected(data.supabaseConnected);
      setFirestoreConnected(Boolean(data.firestoreConnected));
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      const res = await updateAdminConfig(editConfig);
      setConfig(res.config);
      setSaveStatus('Configuration saved successfully!');
      triggerHaptic('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('Failed to save configuration');
      triggerHaptic('error');
    }
  };

  const handleToggleVip = async (user: UserProfile) => {
    triggerHaptic('medium');
    const newStatus = !user.channel_unlocked;
    try {
      const updated = await adminUpdateUser(user.id, {
        channel_unlocked: newStatus,
        channel_approved: newStatus,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err) {
      console.error('Failed to update VIP status:', err);
    }
  };

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'paid' | 'rejected') => {
    triggerHaptic('medium');
    try {
      await adminHandleWithdrawal(id, status);
      await loadData();
    } catch (err) {
      console.error('Failed to update withdrawal:', err);
    }
  };

  const copySqlSchema = () => {
    fetch('/api/supabase/sql')
      .then((r) => r.text())
      .then((sql) => {
        navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        triggerHaptic('success');
        setTimeout(() => setCopiedSql(false), 2500);
      });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.includes(searchQuery) ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#121118] text-neutral-100 flex flex-col max-w-lg mx-auto overflow-hidden shadow-2xl animate-fade-in font-sans">
      {/* Admin Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#1a1822] border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Admin Console</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-400 text-neutral-950 font-black">
                @{config?.admin_username || 'paulallen'}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  firestoreConnected ? 'bg-emerald-400 animate-pulse' : supabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{firestoreConnected ? 'Firebase Firestore Synced' : supabaseConnected ? 'Supabase Connected' : 'Persistent Storage'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-close-admin-panel"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold hover:bg-neutral-700 transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Admin Quick Metrics Strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-1 p-2 bg-[#16141d] border-b border-neutral-800/80 text-center">
          <div className="p-1.5 rounded-lg bg-neutral-900/60">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Users</div>
            <div className="text-sm font-bold text-white font-mono">{stats.total_users}</div>
          </div>
          <div className="p-1.5 rounded-lg bg-neutral-900/60">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Ads Watched</div>
            <div className="text-sm font-bold text-amber-400 font-mono">{stats.total_ads_watched}</div>
          </div>
          <div className="p-1.5 rounded-lg bg-neutral-900/60">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">VIPs (10+)</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{stats.total_vip_unlocked}</div>
          </div>
          <div className="p-1.5 rounded-lg bg-neutral-900/60">
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Pending W/D</div>
            <div className="text-sm font-bold text-indigo-400 font-mono">{stats.pending_withdrawals}</div>
          </div>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-neutral-800 bg-[#17151e] overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-3 font-semibold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'users'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 py-2.5 px-3 font-semibold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'withdrawals'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Payouts ({withdrawals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monetag')}
          className={`flex-1 py-2.5 px-3 font-semibold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'monetag'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Monetag & Ads</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 py-2.5 px-3 font-semibold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'database'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cloud DB</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: USERS & VIP AUTO-APPROVAL TRACKER */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or user ID..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const isTenAds = (u.ads_watched || 0) >= (config?.ads_required_for_channel || 10);

                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl bg-[#1c1a24] border border-neutral-800 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                          alt={u.username}
                          className="w-9 h-9 rounded-full bg-neutral-800 object-cover border border-amber-500/30"
                        />
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>@{u.username || u.first_name}</span>
                            {u.is_admin && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-neutral-950 font-bold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            ID: {u.id} · Joined {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          ${u.balance.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-medium">
                          {u.ads_watched} ads watched
                        </div>
                      </div>
                    </div>

                    {/* Progress to 10 Ads */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">Milestone:</span>
                        <span
                          className={`font-mono font-bold ${
                            isTenAds ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {u.ads_watched}/10 Ads
                        </span>
                        {isTenAds && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                            AUTO-APPROVED
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleVip(u)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          u.channel_unlocked
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-amber-500 hover:text-neutral-950'
                        }`}
                      >
                        {u.channel_unlocked ? 'Revoke VIP' : 'Approve VIP'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No withdrawal requests submitted yet.
              </div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-[#1c1a24] border border-neutral-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">
                        ${w.amount.toFixed(2)} via {w.method}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        User: @{w.username} (ID: {w.user_id})
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : w.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {w.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-neutral-900 text-[11px] font-mono text-neutral-300 break-all select-all">
                    {w.wallet_address}
                  </div>

                  {w.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'paid')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'rejected')}
                        className="py-1.5 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold text-xs transition cursor-pointer"
                      >
                        Reject & Refund
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MONETAG ADS & REWARDS CONFIGURATION */}
        {activeTab === 'monetag' && (
          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#1c1a24] border border-neutral-800 space-y-3">
              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Monetag & Reward Settings</span>
              </h3>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Monetag Direct Link URL
                </label>
                <input
                  type="text"
                  value={editConfig.monetag_direct_link || ''}
                  onChange={(e) => setEditConfig({ ...editConfig, monetag_direct_link: e.target.value })}
                  placeholder="https://otieu...direct-link-url"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-[11px] focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Monetag Zone ID
                </label>
                <input
                  type="text"
                  value={editConfig.monetag_zone_id || ''}
                  onChange={(e) => setEditConfig({ ...editConfig, monetag_zone_id: e.target.value })}
                  placeholder="e.g. 11679016"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-[11px] focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Monetag SDK Function
                  </label>
                  <input
                    type="text"
                    value={editConfig.monetag_custom_code || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, monetag_custom_code: e.target.value })}
                    placeholder="e.g. show_11679016"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-[11px] focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Monetag Script URL
                  </label>
                  <input
                    type="text"
                    value={editConfig.monetag_script_url || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, monetag_script_url: e.target.value })}
                    placeholder="//libtl.com/sdk.js"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-[11px] focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Reward Per Ad ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editConfig.reward_per_ad || 0.30}
                    onChange={(e) => setEditConfig({ ...editConfig, reward_per_ad: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Ads for VIP Channel
                  </label>
                  <input
                    type="number"
                    value={editConfig.ads_required_for_channel || 10}
                    onChange={(e) => setEditConfig({ ...editConfig, ads_required_for_channel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">
                  Private VIP Channel Invite Link
                </label>
                <input
                  type="text"
                  value={editConfig.premium_channel_link || ''}
                  onChange={(e) => setEditConfig({ ...editConfig, premium_channel_link: e.target.value })}
                  placeholder="https://t.me/+YourPrivateChannelLink"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-[11px] focus:outline-hidden focus:border-amber-400"
                />
                <div className="text-[10px] text-neutral-500 mt-1">
                  Automatically delivered to users once their watched count hits 10.
                </div>
              </div>
            </div>

            {saveStatus && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 text-center">
                {saveStatus}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold shadow-md hover:brightness-110 active:scale-98 transition cursor-pointer"
            >
              Save Monetag & VIP Settings
            </button>
          </form>
        )}

        {/* TAB 4: DATABASE STORAGE (FIREBASE & SUPABASE) */}
        {activeTab === 'database' && (
          <div className="space-y-3 text-xs">
            {/* Firebase Firestore Card */}
            <div className="p-4 rounded-2xl bg-[#1c1a24] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-sm">Firebase Firestore Database</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    firestoreConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {firestoreConnected ? 'LIVE SYNC ACTIVE' : 'PROVISIONED & READY'}
                </span>
              </div>

              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Google Cloud Firestore is provisioned for PayPlus to automatically sync and store users, VIP channel unlock approvals (after 10 ads), and withdrawal requests in real time.
              </p>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                <div className="font-bold text-neutral-300 text-[11px]">Active Firestore Collections</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
                  <div className="p-2 rounded-lg bg-black/40 border border-neutral-800/80">
                    <span className="text-amber-400 font-bold">/users</span> (IDs, Ads, Balances)
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-neutral-800/80">
                    <span className="text-amber-400 font-bold">/withdrawals</span> (Payouts)
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-neutral-800/80">
                    <span className="text-amber-400 font-bold">/ads_history</span> (Logs)
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-neutral-800/80">
                    <span className="text-amber-400 font-bold">/app_settings</span> (Config)
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Optional Sync Card */}
            <div className="p-4 rounded-2xl bg-[#1c1a24] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm">Supabase Integration (Secondary)</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    supabaseConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {supabaseConnected ? 'SYNCED' : 'OPTIONAL'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="font-bold text-neutral-300 text-[11px]">Supabase SQL Schema</div>
                <button
                  type="button"
                  onClick={copySqlSchema}
                  className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Schema Copied!' : 'Copy Supabase SQL Schema'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
