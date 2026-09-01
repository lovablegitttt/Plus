import React from 'react';
import { PlayCircle, CheckSquare, Users, DollarSign } from 'lucide-react';
import { triggerHaptic } from '../lib/telegram';

export type TabType = 'ads' | 'tasks' | 'invite' | 'withdraw';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  vipUnlocked: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  vipUnlocked,
}) => {
  const tabs = [
    {
      id: 'ads' as TabType,
      label: 'Ads',
      icon: PlayCircle,
      badge: vipUnlocked ? 'VIP' : undefined,
    },
    {
      id: 'tasks' as TabType,
      label: 'Tasks',
      icon: CheckSquare,
    },
    {
      id: 'invite' as TabType,
      label: 'Invite',
      icon: Users,
    },
    {
      id: 'withdraw' as TabType,
      label: 'Withdraw',
      icon: DollarSign,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#ffffff]/95 backdrop-blur-md border-t border-[#f0ebd9] z-40 shadow-lg"
    >
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                triggerHaptic('light');
                onSelectTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isActive ? 'text-[#c68205]' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {/* Active Top Highlight line */}
              {isActive && (
                <div className="absolute top-0 inset-x-4 h-[2.5px] bg-[#d78f0b] rounded-b-full" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#d78f0b]' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[9px] font-extrabold bg-amber-400 text-amber-950 px-1 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-xs mt-1 ${isActive ? 'font-bold text-[#b97805]' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
