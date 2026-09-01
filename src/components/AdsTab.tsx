import React from 'react';
import { Play, Sparkles, CheckCircle2, Lock, ArrowRight, ExternalLink, Info, Award } from 'lucide-react';
import { UserProfile, AdRewardConfig } from '../types';
import { triggerHaptic } from '../lib/telegram';

interface AdsTabProps {
  user: UserProfile;
  config: AdRewardConfig;
  onWatchAd: () => void;
  isLoading: boolean;
}

export const AdsTab: React.FC<AdsTabProps> = ({
  user,
  config,
  onWatchAd,
  isLoading,
}) => {
  const adsRequired = config.ads_required_for_channel || 10;
  const progressPercent = Math.min(100, (user.ads_watched / adsRequired) * 100);
  const remainingAds = Math.max(0, adsRequired - user.ads_watched);
  const dailyProgress = `${user.ads_watched_today || 0} / ${config.daily_ad_limit || 15} today`;
  const isVipUnlocked = user.ads_watched >= adsRequired || user.channel_unlocked;

  const handleOpenChannel = () => {
    triggerHaptic('success');
    if (config.premium_channel_link) {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(config.premium_channel_link);
      } else {
        window.open(config.premium_channel_link, '_blank');
      }
    }
  };

  return (
    <div id="tab-content-ads" className="space-y-4 pb-6">
      {/* Header text matching screenshot */}
      <div className="px-1">
        <h2 className="text-base font-bold text-neutral-900">Watch Ads & Earn</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Complete and watch a short video ads and earn <span className="font-semibold text-neutral-800">${config.reward_per_ad.toFixed(2)}</span>
        </p>
      </div>

      {/* Main Watch Ad Action Card */}
      <div
        id="card-watch-ad"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#ffffff] to-[#faf8f2] border-2 border-[#e6dcbf] p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play Button Icon */}
            <button
              id="btn-play-ad-icon"
              onClick={onWatchAd}
              disabled={isLoading}
              className="w-13 h-13 rounded-2xl bg-[#262438] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-6 h-6 fill-white ml-0.5 text-white" />
            </button>

            <div>
              <div className="font-bold text-sm text-neutral-900">Watch Ad</div>
              <div className="text-[11px] text-neutral-400">Complete video to earn instantly</div>
            </div>
          </div>

          {/* Reward Badge */}
          <div className="px-3 py-1 rounded-xl bg-[#595267] text-white font-bold text-sm shadow-xs">
            +${config.reward_per_ad.toFixed(2)}
          </div>
        </div>

        {/* Daily Progress bar */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 mb-1.5">
            <span>Daily Limit</span>
            <span className="font-semibold text-amber-700">{dailyProgress}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#f0ebd7] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((user.ads_watched_today || 0) / (config.daily_ad_limit || 15)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Big Action Button */}
        <button
          id="btn-watch-ad-action"
          onClick={onWatchAd}
          disabled={isLoading}
          className="w-full mt-3.5 py-3 rounded-xl bg-gradient-to-r from-[#ebd078] via-[#e2be52] to-[#d6ab32] text-neutral-950 font-bold text-sm shadow-sm hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play className="w-4 h-4 fill-neutral-950" />
              <span>Watch Video Ad & Earn ${config.reward_per_ad.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      {/* Ready to earn status indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f2e9] text-[#6d6148] text-xs font-medium border border-[#eae3d2]">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Ready to earn. Monetag ads verified automatically in backend.</span>
      </div>

      {/* 10-Ads VIP Private Channel Milestone Card */}
      <div
        id="card-vip-milestone"
        className={`rounded-2xl p-4.5 border transition-all ${
          isVipUnlocked
            ? 'bg-gradient-to-br from-[#fbf5e2] via-[#fffdfa] to-[#f4ebcb] border-[#d8b965] shadow-md'
            : 'bg-white border-[#eee8d5] shadow-xs'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isVipUnlocked ? 'bg-amber-500 text-neutral-950 shadow-xs' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {isVipUnlocked ? (
                <Sparkles className="w-5 h-5 fill-neutral-950" />
              ) : (
                <Lock className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <span>Private VIP Channel</span>
                {isVipUnlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                    APPROVED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                    10 ADS GOAL
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-500">
                {isVipUnlocked
                  ? 'Access auto-approved by admin @paulallens!'
                  : `Watch ${remainingAds} more ad${remainingAds === 1 ? '' : 's'} to unlock free private channel link`}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-semibold text-neutral-600 mb-1">
            <span>Unlock Progress</span>
            <span className="text-amber-800 font-mono font-bold">
              {user.ads_watched} / {adsRequired} Ads
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#f2ecdc] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isVipUnlocked
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA when unlocked */}
        {isVipUnlocked ? (
          <div className="mt-3.5 pt-3 border-t border-amber-300/40">
            <button
              id="btn-join-vip-channel"
              onClick={handleOpenChannel}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-amber-300 font-bold text-xs shadow-sm hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Join Private VIP Channel (Free Access)</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400 ml-1" />
            </button>
          </div>
        ) : (
          <div className="mt-2 text-[11px] text-neutral-400 text-center">
            Automatic approval granted instantly when count hits 10.
          </div>
        )}
      </div>

      {/* Stats Summary Boxes (2 columns matching screenshot) */}
      <div className="grid grid-cols-2 gap-3">
        <div
          id="stat-total-watched"
          className="p-3.5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs"
        >
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            TOTAL WATCHED
          </div>
          <div className="text-xl font-black text-neutral-900 font-outfit mt-1">
            {user.ads_watched} <span className="text-xs font-normal text-neutral-500">ads</span>
          </div>
        </div>

        <div
          id="stat-total-earned"
          className="p-3.5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs"
        >
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            TOTAL EARNED
          </div>
          <div className="text-xl font-black text-neutral-900 font-outfit mt-1">
            ${user.total_earned.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
