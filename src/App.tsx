import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, AdRewardConfig, WithdrawalRequest } from './types';
import { fetchUser, recordAdWatched, completeTaskApi, submitWithdrawalApi, fetchWithdrawalHistory } from './lib/api';
import { getTelegramWebApp, initTelegramApp, triggerHaptic } from './lib/telegram';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { AdsTab } from './components/AdsTab';
import { TasksTab } from './components/TasksTab';
import { InviteTab } from './components/InviteTab';
import { WithdrawTab } from './components/WithdrawTab';
import { AdPlayerModal } from './components/AdPlayerModal';
import { AdminPanel } from './components/AdminPanel';
import { LanguageModal } from './components/LanguageModal';
import { SupportModal } from './components/SupportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ads');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<AdRewardConfig | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Initialize Telegram User / WebApp
  useEffect(() => {
    initTelegramApp();
    const tg = getTelegramWebApp();

    let userId = '1979711369';
    let username = 'paulallen';
    let firstName = 'Paul';
    let referrerId: string | undefined;

    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      userId = String(u.id);
      username = u.username || `user_${userId}`;
      firstName = u.first_name || 'User';
      if (tg.initDataUnsafe.start_param) {
        referrerId = tg.initDataUnsafe.start_param;
      }
    } else {
      // Check query params in standard browser
      const params = new URLSearchParams(window.location.search);
      if (params.get('userId')) userId = params.get('userId')!;
      if (params.get('startapp')) referrerId = params.get('startapp')!;
    }

    fetchUser(userId, username, firstName, referrerId)
      .then((data) => {
        setUser(data.user);
        setConfig(data.config);
        return fetchWithdrawalHistory(data.user.id);
      })
      .then((history) => {
        setWithdrawals(history);
      })
      .catch((err) => {
        console.error('Initialization error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const handleWatchAdStart = () => {
    triggerHaptic('medium');
    setIsWatchingAd(true);
  };

  const handleRewardGranted = async () => {
    if (!user) return;
    try {
      const res = await recordAdWatched(user.id);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              balance: res.newBalance,
              total_earned: Number((prev.total_earned + res.rewardEarned).toFixed(2)),
              ads_watched: res.adsWatched,
              ads_watched_today: (prev.ads_watched_today || 0) + 1,
              channel_unlocked: res.channelUnlocked,
              channel_approved: res.channelUnlocked ? true : prev.channel_approved,
            }
          : null
      );

      if (res.justUnlocked) {
        triggerHaptic('success');
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        showToast('🎉 CONGRATULATIONS! 10 Ads reached! Private VIP Channel is now UNLOCKED & Auto-Approved!');
      } else {
        showToast(`+${res.rewardEarned.toFixed(2)} Credited to your balance!`);
      }
    } catch (e: any) {
      alert(e.message || 'Reward verification failed');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    const res = await completeTaskApi(user.id, taskId);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            balance: res.newBalance,
            total_earned: Number((prev.total_earned + res.rewardEarned).toFixed(2)),
            tasks_completed: res.tasksCompleted,
          }
        : null
    );
    showToast(`Task completed! +$${res.rewardEarned.toFixed(2)} added.`);
  };

  const handleSubmitWithdrawal = async (
    amount: number,
    method: 'USDT TRC20' | 'PayPal' | 'Mobile Top-Up',
    walletAddress: string
  ) => {
    if (!user) return;
    const res = await submitWithdrawalApi(user.id, amount, method, walletAddress);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            balance: res.newBalance,
          }
        : null
    );
    setWithdrawals((prev) => [res.withdrawal, ...prev]);
  };

  const handleToggleAdminMode = () => {
    const adminUser = (config?.admin_username || 'paulallen').toLowerCase().replace('@', '');
    const currentUsername = (user?.username || '').toLowerCase().replace('@', '');
    const isUserAdmin = user?.is_admin || currentUsername === adminUser || currentUsername === 'paulallen' || currentUsername === 'paulallens';

    if (isUserAdmin) {
      setIsAdminOpen(true);
    } else {
      const pass = window.prompt('Admin panel access restricted to @paulallen.\nEnter Admin Password / Secret Key:');
      if (pass === 'paulallen' || pass === 'paulallen-admin' || pass === config?.admin_username) {
        setIsAdminOpen(true);
      } else if (pass !== null) {
        alert('Access denied. Administrator privileges are reserved for @paulallen.');
      }
    }
  };

  if (isLoading || !user || !config) {
    return (
      <div className="min-h-screen bg-[#fcfaf4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl font-outfit animate-pulse mb-3">
          P+
        </div>
        <div className="text-sm font-bold text-neutral-800">Connecting to PayPlus Bot...</div>
        <div className="text-xs text-neutral-400 mt-1">Checking Supabase database & user state</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf4] text-neutral-900 flex justify-center selection:bg-amber-200">
      <div className="w-full max-w-md bg-[#fcfaf4] min-h-screen pb-20 relative flex flex-col">
        {/* Floating Notification Toast */}
        {notificationToast && (
          <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 p-3 rounded-2xl bg-neutral-900 text-amber-300 text-xs font-semibold shadow-xl border border-amber-500/30 text-center animate-bounce">
            {notificationToast}
          </div>
        )}

        {/* Top Header */}
        <Header
          user={user}
          config={config}
          onOpenSupport={() => setIsSupportOpen(true)}
          onOpenLanguage={() => setIsLanguageOpen(true)}
          isAdminMode={isAdminOpen}
          onToggleAdminMode={handleToggleAdminMode}
        />

        {/* Tab Content Container */}
        <main className="flex-1 px-4 pt-3">
          {activeTab === 'ads' && (
            <AdsTab
              user={user}
              config={config}
              onWatchAd={handleWatchAdStart}
              isLoading={false}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              user={user}
              onCompleteTask={handleCompleteTask}
            />
          )}

          {activeTab === 'invite' && (
            <InviteTab
              user={user}
              config={config}
            />
          )}

          {activeTab === 'withdraw' && (
            <WithdrawTab
              user={user}
              config={config}
              withdrawals={withdrawals}
              onSubmitWithdrawal={handleSubmitWithdrawal}
              isLoading={false}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          vipUnlocked={user.channel_unlocked}
        />

        {/* Modals */}
        <AdPlayerModal
          isOpen={isWatchingAd}
          onClose={() => setIsWatchingAd(false)}
          onComplete={handleRewardGranted}
          config={config}
          currentAdsCount={user.ads_watched}
        />

        {isAdminOpen && (
          <AdminPanel
            onClose={() => {
              setIsAdminOpen(false);
              // Refresh user data after admin tweaks
              fetchUser(user.id).then((d) => {
                setUser(d.user);
                setConfig(d.config);
              });
            }}
          />
        )}

        <LanguageModal
          isOpen={isLanguageOpen}
          onClose={() => setIsLanguageOpen(false)}
          currentLang={selectedLanguage}
          onSelectLang={setSelectedLanguage}
        />

        <SupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
          config={config}
        />
      </div>
    </div>
  );
}
