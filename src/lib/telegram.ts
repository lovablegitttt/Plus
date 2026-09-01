/**
 * Telegram WebApp SDK Safe Wrapper
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          receiver?: TelegramUser;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isVersionAtLeast?: (version: string) => boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage?: {
          setItem: (key: string, value: string, callback?: (err: Error | null, success: boolean) => void) => void;
          getItem: (key: string, callback?: (err: Error | null, value: string) => void) => void;
          getItems: (keys: string[], callback?: (err: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (err: Error | null, success: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (err: Error | null, success: boolean) => void) => void;
          getKeys: (callback?: (err: Error | null, keys: string[]) => void) => void;
        };
      };
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();

      // Check version safely without triggering the getter warning in WebApp v6.0
      const isVersionSupported = typeof tg.isVersionAtLeast === 'function' ? tg.isVersionAtLeast('6.9') : false;

      if (!isVersionSupported) {
        // Define CloudStorage polyfill directly on tg to avoid version warning
        Object.defineProperty(tg, 'CloudStorage', {
          value: {
            setItem: (key: string, value: string, callback?: (err: Error | null, success: boolean) => void) => {
              try {
                localStorage.setItem(`tg_cloud_${key}`, value);
                callback?.(null, true);
              } catch (e: any) {
                callback?.(e, false);
              }
            },
            getItem: (key: string, callback?: (err: Error | null, value: string) => void) => {
              try {
                const val = localStorage.getItem(`tg_cloud_${key}`) || '';
                callback?.(null, val);
              } catch (e: any) {
                callback?.(e, '');
              }
            },
            getItems: (keys: string[], callback?: (err: Error | null, values: Record<string, string>) => void) => {
              try {
                const res: Record<string, string> = {};
                keys.forEach(k => {
                  res[k] = localStorage.getItem(`tg_cloud_${k}`) || '';
                });
                callback?.(null, res);
              } catch (e: any) {
                callback?.(e, {});
              }
            },
            removeItem: (key: string, callback?: (err: Error | null, success: boolean) => void) => {
              try {
                localStorage.removeItem(`tg_cloud_${key}`);
                callback?.(null, true);
              } catch (e: any) {
                callback?.(e, false);
              }
            },
            removeItems: (keys: string[], callback?: (err: Error | null, success: boolean) => void) => {
              try {
                keys.forEach(k => localStorage.removeItem(`tg_cloud_${k}`));
                callback?.(null, true);
              } catch (e: any) {
                callback?.(e, false);
              }
            },
            getKeys: (callback?: (err: Error | null, keys: string[]) => void) => {
              try {
                const keys: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k && k.startsWith('tg_cloud_')) {
                    keys.push(k.replace('tg_cloud_', ''));
                  }
                }
                callback?.(null, keys);
              } catch (e: any) {
                callback?.(e, []);
              }
            }
          },
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    } catch (e) {
      console.warn('Telegram WebApp initialization notice:', e);
    }
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
  const tg = getTelegramWebApp();
  if (tg && tg.HapticFeedback) {
    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch {
      // Haptics not supported
    }
  }
}
