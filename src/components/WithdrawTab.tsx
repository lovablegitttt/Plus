import React, { useState } from 'react';
import { Send, DollarSign, Wallet, CheckCircle, Clock } from 'lucide-react';
import { UserProfile, AdRewardConfig, WithdrawalRequest } from '../types';
import { triggerHaptic } from '../lib/telegram';

interface WithdrawTabProps {
  user: UserProfile;
  config: AdRewardConfig;
  withdrawals: WithdrawalRequest[];
  onSubmitWithdrawal: (amount: number, method: 'USDT TRC20' | 'PayPal' | 'Mobile Top-Up', wallet: string) => Promise<void>;
  isLoading: boolean;
}

export const WithdrawTab: React.FC<WithdrawTabProps> = ({
  user,
  config,
  withdrawals,
  onSubmitWithdrawal,
  isLoading,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'USDT TRC20' | 'PayPal' | 'Mobile Top-Up'>('USDT TRC20');
  const [amount, setAmount] = useState<string>('10.00');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const minWithdrawal = config.min_withdrawal || 10.00;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const val = parseFloat(amount);
    if (isNaN(val) || val < minWithdrawal) {
      setErrorMsg(`Minimum withdrawal amount is $${minWithdrawal.toFixed(2)}`);
      triggerHaptic('error');
      return;
    }
    if (val > user.balance) {
      setErrorMsg('Insufficient balance.');
      triggerHaptic('error');
      return;
    }
    if (!walletAddress.trim()) {
      setErrorMsg('Please enter your receiving address / account number.');
      triggerHaptic('error');
      return;
    }

    try {
      await onSubmitWithdrawal(val, selectedMethod, walletAddress);
      triggerHaptic('success');
      setSuccessMsg('Withdrawal request submitted! Admin @paulallens will process it.');
      setWalletAddress('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal failed');
      triggerHaptic('error');
    }
  };

  return (
    <div id="tab-content-withdraw" className="space-y-4 pb-6">
      <div className="p-5 rounded-2xl bg-white border border-[#eee8d5] shadow-xs">
        <label className="block text-xs font-bold text-neutral-900 mb-2.5">
          <Wallet className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
          Payment Method
        </label>

        {/* 3 Payment Methods Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedMethod('USDT TRC20')}
            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              selectedMethod === 'USDT TRC20'
                ? 'bg-amber-100/60 border-amber-400 text-amber-950 font-bold shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">₮</div>
            <span className="text-[11px] leading-tight">USDT TRC20</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('PayPal')}
            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              selectedMethod === 'PayPal'
                ? 'bg-amber-100/60 border-amber-400 text-amber-950 font-bold shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">P</div>
            <span className="text-[11px] leading-tight">PayPal</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('Mobile Top-Up')}
            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              selectedMethod === 'Mobile Top-Up'
                ? 'bg-amber-100/60 border-amber-400 text-amber-950 font-bold shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">📱</div>
            <span className="text-[11px] leading-tight">Mobile Top-Up</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              AMOUNT
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (e.g. 10.00)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-hidden"
            />
            <div className="text-[11px] text-neutral-400 mt-1">
              Available balance: <span className="font-semibold text-neutral-700">${user.balance.toFixed(2)}</span> · Min ${minWithdrawal.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              WALLET ADDRESS / ACCOUNT
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder={selectedMethod === 'USDT TRC20' ? 'e.g. TXyz...abc' : selectedMethod === 'PayPal' ? 'PayPal email' : '+1 234 567 8900'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium focus:bg-white focus:border-amber-400 focus:outline-hidden"
            />
            <div className="text-[11px] text-neutral-400 mt-1">
              Enter your {selectedMethod} destination
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#282634] text-white font-bold text-xs shadow-md hover:bg-neutral-800 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Withdrawal Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      {withdrawals.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-[#eee8d5]">
          <h3 className="text-xs font-bold text-neutral-800 mb-2.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            Recent Requests
          </h3>
          <div className="space-y-2">
            {withdrawals.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-800">${item.amount.toFixed(2)} via {item.method}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
