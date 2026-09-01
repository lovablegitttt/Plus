import React, { useState } from 'react';
import { Megaphone, Bot, Youtube, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { triggerHaptic } from '../lib/telegram';

interface TasksTabProps {
  user: UserProfile;
  onCompleteTask: (taskId: string) => Promise<void>;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  user,
  onCompleteTask,
}) => {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const tasks = [
    {
      id: 'task-channels',
      title: 'Join Channels',
      subtitle: 'Earn $0.10 per channel',
      icon: Megaphone,
      progressText: user.tasks_completed?.['task-channels'] ? '4 / 4' : '0 / 4',
      completed: Boolean(user.tasks_completed?.['task-channels']),
      buttonText: 'Join',
      actionUrl: 'https://t.me/telegram',
      progressPercent: user.tasks_completed?.['task-channels'] ? 100 : 25,
    },
    {
      id: 'task-bots',
      title: 'Start Bots',
      subtitle: 'Earn $0.10 per bot',
      icon: Bot,
      progressText: user.tasks_completed?.['task-bots'] ? '10 / 10' : '1 / 10',
      completed: Boolean(user.tasks_completed?.['task-bots']),
      buttonText: 'Start',
      actionUrl: 'https://t.me/BotFather',
      progressPercent: user.tasks_completed?.['task-bots'] ? 100 : 35,
    },
    {
      id: 'task-subscribe',
      title: 'Subscribe Channel',
      subtitle: 'Earn $0.10 for subscribing',
      icon: Youtube,
      progressText: user.tasks_completed?.['task-subscribe'] ? '1 / 1' : '0 / 1',
      completed: Boolean(user.tasks_completed?.['task-subscribe']),
      buttonText: 'Subscribe',
      actionUrl: 'https://t.me/durov',
      progressPercent: user.tasks_completed?.['task-subscribe'] ? 100 : 0,
    },
  ];

  const handleTaskAction = async (taskId: string, actionUrl: string, completed: boolean) => {
    if (completed) return;
    triggerHaptic('medium');

    // Open target link
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(actionUrl);
    } else {
      window.open(actionUrl, '_blank');
    }

    // Trigger verification and credit
    setLoadingTaskId(taskId);
    try {
      // Simulate brief verification check
      await new Promise((r) => setTimeout(r, 1200));
      await onCompleteTask(taskId);
      triggerHaptic('success');
    } finally {
      setLoadingTaskId(null);
    }
  };

  return (
    <div id="tab-content-tasks" className="space-y-4 pb-6">
      <div className="flex items-center gap-2 px-1">
        <span className="text-amber-600 font-bold">☑</span>
        <h2 className="text-base font-bold text-neutral-900">Complete Tasks & Earn Rewards</h2>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          const isLoading = loadingTaskId === task.id;

          return (
            <div
              key={task.id}
              id={`card-${task.id}`}
              className="p-4 rounded-2xl bg-white border border-[#eee8d5] shadow-xs hover:border-[#dfd3b5] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#faf7ec] border border-[#ece3ca] flex items-center justify-center text-amber-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-neutral-900">{task.title}</div>
                    <div className="text-xs text-neutral-500">{task.subtitle}</div>
                  </div>
                </div>

                <button
                  id={`btn-${task.id}`}
                  onClick={() => handleTaskAction(task.id, task.actionUrl, task.completed)}
                  disabled={isLoading || task.completed}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gradient-to-b from-[#e5d59c] to-[#ccb467] text-neutral-900 shadow-xs hover:brightness-105 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  ) : task.completed ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Done</span>
                    </>
                  ) : (
                    <span>{task.buttonText}</span>
                  )}
                </button>
              </div>

              {/* Progress bar matching screenshot */}
              <div className="mt-3 pt-2.5 border-t border-neutral-100">
                <div className="flex justify-between text-[10px] text-neutral-400 font-medium mb-1">
                  <span>Progress</span>
                  <span className="font-mono text-neutral-600">{task.progressText}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#f4f0e2] overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${task.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
