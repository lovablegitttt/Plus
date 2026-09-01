import React from 'react';
import { X, Send, HelpCircle, Shield, Sparkles, MessageCircle } from 'lucide-react';
import { AdRewardConfig } from '../types';
import { triggerHaptic } from '../lib/telegram';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AdRewardConfig;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen) return null;

  const adminHandle = config.admin_username || 'paulallens';
  const supportUrl = `https://t.me/${adminHandle}`;

  const handleContactAdmin = () => {
    triggerHaptic('medium');
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#fdfbf6] border border-[#e8dfc7] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Support & Community</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-neutral-600">
          <div className="p-3 rounded-2xl bg-white border border-[#eee8d5] space-y-1">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>10 Ads = VIP Channel Access</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              When you complete 10 watched ads, your access is automatically approved and the direct private channel link unlocks immediately.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#eee8d5] space-y-1">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Inquiries & Payouts</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Managed directly by @{adminHandle}. Instant verification, high CPM monetization, and automated payouts.
            </p>
          </div>
        </div>

        <button
          onClick={handleContactAdmin}
          className="w-full py-3 rounded-xl bg-[#282634] text-white font-bold text-xs shadow-md hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span>Chat with Admin @{adminHandle}</span>
        </button>
      </div>
    </div>
  );
};
