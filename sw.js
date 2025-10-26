// This is the "Offline copy of pages" service worker

// It's a good practice to have separate cache names for different types of assets.
const CACHE_PAGES = "atm-pages-v1";
const CACHE_STATIC = "atm-static-v1";
const CACHE_IMAGES = "atm-images-v1";
const CACHE_AUDIO = "atm-audio-v1";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// --- BACKGROUND TIMER LOGIC ---

let timerId = null;
let audio = null;

const silentAudioDataUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';


const defaultState = {
    timeRemaining: 25 * 60,
    totalDuration: 25 * 60,
    isActive: false,
    sessionType: 'Work',
    selectedTaskId: null,
    selectedTaskTitle: 'No Task Selected',
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
};

let timerState = { ...defaultState };

const formatTime = (seconds) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const broadcastState = () => {
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'TIMER_STATE_UPDATE', payload: timerState });
        });
    });
};

const updateMediaSession = () => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `${timerState.sessionType}: ${timerState.selectedTaskTitle}`,
            artist: 'AI Time Master',
            album: `${formatTime(timerState.timeRemaining)} remaining`,
        });
    }
};

const stopTimer = () => {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    if (audio) {
        audio.pause();
        audio = null;
    }
    timerState.isActive = false;
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
    }
    broadcastState();
};

const startTimer = () => {
    timerState.isActive = true;
    if (!audio) {
        audio = new Audio(silentAudioDataUrl);
        audio.loop = true;
    }
    audio.play().catch(e => console.error("Audio playback failed:", e));

    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
        updateMediaSession();
    }
    broadcastState();

    timerId = setInterval(() => {
        timerState.timeRemaining -= 1;
        updateMediaSession();
        broadcastState();

        if (timerState.timeRemaining < 0) {
            const completedSessionType = timerState.sessionType;
            const completedDuration = completedSessionType === 'Work' ? timerState.workDuration : timerState.breakDuration;

            // Switch session
            timerState.sessionType = completedSessionType === 'Work' ? 'Break' : 'Work';
            timerState.timeRemaining = timerState.sessionType === 'Work' ? timerState.workDuration : timerState.breakDuration;
            timerState.totalDuration = timerState.timeRemaining;

            // Show notification
            const notificationTitle = completedSessionType === 'Work' ? 'Focus session complete!' : "Break's over!";
            const notificationBody = completedSessionType === 'Work' ? `Great job! Time for a break.` : "Time to get back to focus!";
            self.registration.showNotification(notificationTitle, {
                body: notificationBody,
                icon: '/icon.svg',
                badge: '/icon.svg',
            });
            
            // Notify client to log the session
            if (completedSessionType === 'Work') {
                self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'LOG_SESSION',
                            payload: { taskId: timerState.selectedTaskId, duration: completedDuration }
                        });
                    });
                });
            }

            // Update UI for the new session
            updateMediaSession();
            broadcastState();
        }
    }, 1000);
};

self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'START_TIMER':
            stopTimer(); // Ensure any existing timer is stopped
            timerState = {
                ...timerState,
                ...payload,
                timeRemaining: payload.workDuration,
                totalDuration: payload.workDuration,
                sessionType: 'Work',
            };
            startTimer();
            break;
        case 'PAUSE_TIMER':
            stopTimer();
            break;
        case 'RESET_TIMER':
            stopTimer();
            timerState = {
                ...defaultState,
                ...payload, // a payload with new durations might be sent
                timeRemaining: payload.workDuration,
                totalDuration: payload.workDuration,
            };
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = null;
            }
            broadcastState();
            break;
        case 'GET_STATE':
            // Send current state to the client that asked for it
            if (event.source) {
                 event.source.postMessage({ type: 'TIMER_STATE_UPDATE', payload: timerState });
            }
            break;
    }
});

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
       if (!timerState.isActive) startTimer();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
       if (timerState.isActive) stopTimer();
    });
}


// --- PWA OFFLINE CACHING LOGIC ---

if (workbox) {
  console.log(`Workbox is loaded and ready to work offline.`);

  // This allows the new service worker to take control of the page immediately.
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });

  // The original route `new RegExp('/*')` was too broad and caused errors by trying
  // to cache requests with unsupported schemes like 'chrome-extension://'.
  // The following, more specific routes fix this issue and are a PWA best practice.

  // 1. For navigation requests (the HTML page), use a NetworkFirst strategy.
  // This ensures users see the latest content if they are online, but can
  // still load the app from the cache if they are offline.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_PAGES,
    })
  );

  // 2. For CSS, JavaScript, and other static assets, use a StaleWhileRevalidate strategy.
  // This serves content from the cache first for a fast experience, then updates
  // the cache in the background with the latest version from the network.
  // We only cache assets from our own origin and our trusted CDN.
  workbox.routing.registerRoute(
    ({ request, url }) =>
      (request.destination === 'script' || request.destination === 'style') &&
      (url.origin === self.location.origin || url.origin === 'https://aistudiocdn.com' || url.origin === 'https://cdn.tailwindcss.com'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_STATIC,
      plugins: [
        // Ensure that we only cache successful responses (including opaque responses from CDNs).
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 3. For images, use a CacheFirst strategy.
  // Once an image is in the cache, it will be served from there, which is ideal
  // for assets that don't change often.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_IMAGES,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache up to 50 images.
          maxEntries: 50,
          // Cache for up to 30 days.
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // 4. For audio files, use a CacheFirst strategy.
  // This ensures any notification sounds are available offline.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'audio',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_AUDIO,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20, // Cache up to 20 audio files
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  
} else {
  console.log(`Workbox failed to load, offline functionality will be limited.`);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
