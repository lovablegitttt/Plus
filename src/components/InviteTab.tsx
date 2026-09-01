import React, { useState } from 'react';
import { UserPlus, Copy, Send, Check, Users, DollarSign, Sparkles } from 'lucide-react';
import { UserProfile, AdRewardConfig } from '../types';
import { triggerHaptic } from '../lib/telegram';

interface InviteTabProps {
  user: UserProfile;
  config: AdRewardConfig;
}

export const InviteTab: React.FC<InviteTabProps> = ({
  user,
  config,
}) => {
  const [copied, setCopied] = useState(false);

  const botUsername = config.bot_username || 'Pay_Plus_Bot';
  const inviteLink = `https://t.me/${botUsername}/app?startapp=${user.id}`;
  const inviteReward = config.invite_reward || 0.75;

  const handleCopyLink = () => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    triggerHaptic('success');
    const shareText = `🚀 Earn real money watching ads on PayPlus! Watch 10 ads to get FREE access to the Private VIP Channel!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div id="tab-content-invite" className="space-y-4 pb-6">
      {/* Header section card */}
      <div
        id="card-invite-banner"
        className="p-5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#faf6eb] border border-[#ebe0c5] flex items-center justify-center text-amber-700 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Invite & Earn</h2>
            <div className="text-xs font-semibold text-amber-800 mt-0.5">
              Earn ${inviteReward.toFixed(2)} for each invite
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              Copy and share your invite link with friends to earn more.
            </p>
          </div>
        </div>

        {/* Link container */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-neutral-900 mb-2">
            Your Invite Link
          </label>

          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-[#f7f5ed] border border-[#e5decb]">
            <span className="text-[11px] text-neutral-600 font-mono truncate select-all flex-1">
              {inviteLink}
            </span>

            <button
              id="btn-copy-invite-link"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-lg bg-[#302c38] text-white text-xs font-semibold hover:bg-neutral-800 transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Share with friends button */}
          <button
            id="btn-share-with-friends"
            onClick={handleShareTelegram}
            className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-[#ebd078] via-[#e2be52] to-[#d6ab32] text-neutral-950 font-bold text-xs shadow-xs hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-neutral-950" />
            <span>Share with Friends</span>
          </button>
        </div>
      </div>

      {/* Stats summary boxes matching screenshot */}
      <div className="grid grid-cols-2 gap-3">
        <div
          id="stat-friends-invited"
          className="p-3.5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs text-center"
        >
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            FRIENDS INVITED
          </div>
          <div className="text-xl font-black text-neutral-900 font-outfit mt-1 flex items-center justify-center gap-1">
            <span>{user.friends_invited || 0}</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        <div
          id="stat-earned-invites"
          className="p-3.5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs text-center"
        >
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            EARNED FROM INVITES
          </div>
          <div className="text-xl font-black text-neutral-900 font-outfit mt-1 flex items-center justify-center gap-0.5">
            <span>${(user.earned_from_invites || 0).toFixed(2)}</span>
            <span className="text-sm font-normal text-neutral-400">$</span>
          </div>
        </div>
      </div>
    </div>
  );
};
