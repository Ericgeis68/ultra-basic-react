// Web Push annulé: garder un stub pour ne pas casser les imports éventuels
import { useCallback, useEffect, useState } from 'react';

// Public VAPID key placeholder. Replace with your real key from server/env.
// For local tests, you can set it via window.__VAPID_PUBLIC_KEY at runtime.
const getVapidPublicKey = (): string | null => {
  const fromWindow = (window as any).__VAPID_PUBLIC_KEY as string | undefined;
  if (fromWindow) return fromWindow;
  // TODO: fetch from an endpoint or env injection if needed
  return null;
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(userId?: string | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  const subscribe = useCallback(async () => false, []);

  const unsubscribe = useCallback(async () => false, []);

  return { isSupported, permission, isSubscribed, loading, requestPermission, subscribe, unsubscribe };
}


