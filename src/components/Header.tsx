import React from 'react';
import { MessageSquare, Globe, Sparkles, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { UserProfile, AdRewardConfig } from '../types';

interface HeaderProps {
  user: UserProfile;
  config: AdRewardConfig;
  onOpenSupport: () => void;
  onOpenLanguage: () => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  config,
  onOpenSupport,
  onOpenLanguage,
  isAdminMode,
  onToggleAdminMode,
}) => {
  return (
    <header className="w-full bg-[#fbf9f3] pt-2 pb-3 px-4 select-none">
      {/* Top Mini App bar matching Telegram native shell */}
      <div className="flex items-center justify-between py-1 mb-2 text-sm text-neutral-600">
        <button
          id="btn-telegram-close"
          onClick={() => {
            if (window.Telegram?.WebApp?.close) {
              window.Telegram.WebApp.close();
            } else {
              window.location.reload();
            }
          }}
          className="text-[#007aff] font-medium hover:opacity-80 transition cursor-pointer"
        >
          Close
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-neutral-900 text-[15px]">PayPlus - Earning</span>
          <span className="text-[11px] text-neutral-400 -mt-0.5">mini app</span>
        </div>
        <button
          id="btn-telegram-options"
          onClick={onToggleAdminMode}
          title="Admin & Settings"
          className="p-1 text-neutral-500 hover:text-neutral-900 transition flex items-center gap-1 cursor-pointer"
        >
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Admin</span>
          </div>
        </button>
      </div>

      {/* Brand & Action Badges */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <div className="flex items-baseline">
          <span className="font-black text-2xl tracking-tight text-[#2b2b2b] font-outfit">Pay</span>
          <span className="font-black text-2xl tracking-tight text-[#d48b04] font-outfit">Plus</span>
          <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">BOT</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-customer-support"
            onClick={onOpenSupport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fdfaf2] border border-[#e8dcb9] text-[#715c26] text-xs font-semibold shadow-xs hover:bg-[#faf4e1] transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#b0882e]" />
            <span>Customer<br className="sm:hidden" /> Support</span>
          </button>

          <button
            id="btn-language-select"
            onClick={onOpenLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fdfaf2] border border-[#e8dcb9] text-[#715c26] text-xs font-semibold shadow-xs hover:bg-[#faf4e1] transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#b0882e]" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-neutral-400 font-normal">Language</div>
              <div>English</div>
            </div>
          </button>
        </div>
      </div>

      {/* Total Balance Gold Card */}
      <div
        id="card-total-balance"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#473919] via-[#35280d] to-[#241a06] text-white p-5 shadow-lg border border-[#78612b]"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-wider font-bold text-amber-200/80 uppercase">
              TOTAL BALANCE
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#f7cd46] tracking-tight font-outfit mt-1">
              ${user.balance.toFixed(2)}
            </div>
            <div className="text-xs text-amber-200/70 font-medium mt-0.5">
              Available to withdraw
            </div>
          </div>

          {/* User Profile Avatar & ID */}
          <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-xs p-2 rounded-xl border border-amber-500/20">
            <div className="relative">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user.first_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#eab308] shadow-sm bg-neutral-800"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#241a06] rounded-full" />
            </div>
            <div className="text-right">
              <div className="font-bold text-sm text-amber-100 flex items-center gap-1 justify-end">
                {user.first_name || 'Paul'}
                {user.channel_unlocked && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-black font-extrabold">VIP</span>
                )}
              </div>
              <div className="text-[11px] text-amber-300/80 font-mono">
                ID: {user.id}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Row */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200/80 font-medium overflow-x-auto">
          <div className="flex items-center gap-1">
            <span className="text-[#f7cd46]">⊙</span> Watch Ads
          </div>
          <span className="text-amber-500/40">•</span>
          <div className="flex items-center gap-1">
            <span className="text-[#f7cd46]">☑</span> Complete Tasks
          </div>
          <span className="text-amber-500/40">•</span>
          <div className="flex items-center gap-1">
            <span className="text-[#f7cd46]">👥</span> Invite Friends
          </div>
        </div>
      </div>
    </header>
  );
};
