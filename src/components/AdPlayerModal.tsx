import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Sparkles, X, Volume2, ShieldCheck, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../lib/telegram';
import { AdRewardConfig } from '../types';

interface AdPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  config: AdRewardConfig;
  currentAdsCount: number;
}

export const AdPlayerModal: React.FC<AdPlayerModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  config,
  currentAdsCount,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [justHitMilestone, setJustHitMilestone] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanClaim(false);
      setIsClaiming(false);
      setJustHitMilestone(false);
      return;
    }

    // Trigger Monetag SDK (show_11679016 or custom handler) if available
    const monetagSdkFn = (window as any).show_11679016 || 
      (config.monetag_custom_code && (window as any)[config.monetag_custom_code]) ||
      (config.monetag_zone_id && (window as any)[`show_${config.monetag_zone_id}`]);

    if (typeof monetagSdkFn === 'function') {
      try {
        console.log('Invoking Monetag SDK (Zone 11679016)...');
        const res = monetagSdkFn();
        if (res && typeof res.then === 'function') {
          res.then(() => {
            console.log('Monetag ad impression completed via SDK');
            setCountdown(0);
            setCanClaim(true);
            triggerHaptic('success');
          }).catch((err: any) => {
            console.warn('Monetag SDK event notice:', err);
          });
        }
      } catch (e) {
        console.warn('Monetag SDK invocation notice:', e);
      }
    }

    // Trigger Monetag direct link if provided
    if (config.monetag_direct_link) {
      try {
        console.log('Triggering Monetag ad link:', config.monetag_direct_link);
      } catch (e) {
        console.warn('Ad link notice:', e);
      }
    }

    // Countdown timer for ad viewing
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClaim(true);
          triggerHaptic('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, config.monetag_direct_link]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;
    setIsClaiming(true);

    try {
      await onComplete();
      
      const newCount = currentAdsCount + 1;
      if (newCount === 10 || (newCount >= 10 && currentAdsCount < 10)) {
        setJustHitMilestone(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to claim ad reward:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleOpenVipChannel = () => {
    if (config.premium_channel_link) {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(config.premium_channel_link);
      } else {
        window.open(config.premium_channel_link, '_blank');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        id="ad-player-container"
        className="w-full max-w-sm rounded-3xl bg-[#1e1c24] border border-amber-500/30 text-white overflow-hidden shadow-2xl relative"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#15131a] border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Monetag Sponsored Video</span>
          </div>

          <div className="flex items-center gap-2">
            {!canClaim ? (
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                Reward in {countdown}s
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                Ready to Claim
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Milestone Celebration Modal State */}
        {justHitMilestone ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-neutral-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Sparkles className="w-9 h-9 fill-neutral-950" />
            </div>

            <div>
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/40">
                Milestone Reached!
              </span>
              <h3 className="text-xl font-black text-white mt-2 font-outfit">
                Private VIP Channel Unlocked!
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                You have watched <b>10 Ads</b>! Admin <b>@{config.admin_username}</b> has automatically approved your free access.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/30 text-left text-xs space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Ad Reward:</span>
                <span className="font-bold text-amber-400">+${config.reward_per_ad.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>VIP Status:</span>
                <span className="font-bold text-emerald-400">AUTO-APPROVED</span>
              </div>
            </div>

            <button
              id="btn-claim-vip-access"
              onClick={handleOpenVipChannel}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-neutral-950 font-black text-sm shadow-md hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-neutral-950" />
              <span>Join Free VIP Channel Now</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Normal Ad Video Preview Screen */
          <div className="p-4 space-y-4">
            {/* Mock/Real Video Screen */}
            <div className="relative aspect-video rounded-2xl bg-neutral-900 overflow-hidden border border-neutral-700 flex flex-col items-center justify-center p-4 text-center">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-neutral-900 to-amber-950/40 opacity-80" />
              
              <div className="relative z-10 space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto animate-pulse">
                  <Play className="w-6 h-6 fill-amber-300 ml-0.5" />
                </div>
                <div className="text-sm font-bold text-white">Monetag Partner Video</div>
                <div className="text-xs text-neutral-400">
                  {canClaim ? 'Video completed! Tap below to claim reward.' : `Watching sponsored content (${countdown}s)...`}
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-neutral-800">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Ad Sponsor Details */}
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs">
              <div>
                <div className="text-neutral-400 text-[11px]">Ad Reward</div>
                <div className="font-bold text-amber-400 text-sm font-outfit">+${config.reward_per_ad.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-neutral-400 text-[11px]">Milestone Goal</div>
                <div className="font-bold text-neutral-200">
                  {currentAdsCount + 1} / {config.ads_required_for_channel || 10} for VIP
                </div>
              </div>
            </div>

            {/* Claim button */}
            <button
              id="btn-claim-ad-reward"
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                canClaim
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-neutral-950 shadow-md hover:brightness-110 active:scale-98'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isClaiming ? (
                <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              ) : canClaim ? (
                <>
                  <CheckCircle className="w-4 h-4 text-neutral-950" />
                  <span>Claim +${config.reward_per_ad.toFixed(2)} & Credit Count</span>
                </>
              ) : (
                <span>Please wait {countdown}s...</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
