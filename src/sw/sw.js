import { precacheAndRoute } from 'workbox-precaching';
import { setResub } from './resub';
import { notification } from './notify';

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', (event) => {
    // @ts-ignore
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // @ts-ignore
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
    // @ts-ignore
    const {title, options} = notification(event.data?.text() ?? null);
    // @ts-ignore
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    // @ts-ignore
    event.notification.close();

    // @ts-ignore
    const url = event.notification.data?.url || '/signals';

    // @ts-ignore
    event.waitUntil((async () => {
        // @ts-ignore
        const list = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
        // @ts-ignore
        const client = list.find(c => new URL(c.url).origin === self.location.origin);

        if (client) {
            client.postMessage({t: 'nav', url});
            try {
                await client.focus();
            } catch {
            }
            return;
        }
        // @ts-ignore
        await self.clients.openWindow('/#' + url.replace(/^\//, ''));
    })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
    // @ts-ignore
    const key = event.newSubscription ? null : event.oldSubscription?.options?.applicationServerKey;

    // @ts-ignore
    event.waitUntil((async () => {
        try {
            if (key) {
                // @ts-ignore
                await self.registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: key});
            }
        } catch {
        } finally {
            await setResub(true);
        }
    })());
});
