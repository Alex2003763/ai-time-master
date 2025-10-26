/**
 * Checks if notification permission has been granted, and requests it if not.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  // We can only request permission if it's not denied.
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Sends a desktop notification to the user.
 * @param {string} title - The title of the notification.
 * @param {NotificationOptions} [options] - Optional settings for the notification (e.g., body text).
 */
export const sendNotification = (title: string, options?: NotificationOptions): void => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }

  if (Notification.permission === 'granted') {
    // Ensure the service worker is ready before trying to use it for notifications.
    // This allows notifications to be delivered even if the app tab isn't active.
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        ...options,
        icon: '/icon.svg',
        badge: '/icon.svg',
      });
    }).catch(err => {
      // Fallback to client-side notification if service worker fails
      console.error('Service worker notification failed, falling back to client-side.', err);
      try {
        new Notification(title, {
            ...options,
            icon: '/icon.svg',
            badge: '/icon.svg',
        });
      } catch (e) {
        console.error('Client-side notification also failed.', e);
      }
    });
  }
};