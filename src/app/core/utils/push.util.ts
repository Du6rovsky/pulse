import {ePages} from "../entities/pages.enum";

type PushPerm = NotificationPermission | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function sameKey(key: ArrayBuffer | null | undefined, vapidPublic: string): boolean {
    if (!key) return true;
    const a = new Uint8Array(key);
    const b = urlBase64ToUint8Array(vapidPublic);
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

function isIos(ua: string, platform: string, maxTouchPoints: number): boolean {
    return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function navHash(url: unknown): ePages | null {
    if (typeof url !== 'string') return null;
    const hash = '#' + url.replace(/^\/#?/, '');
    return (Object.values(ePages) as string[]).includes(hash) ? hash as ePages : null;
}

function pushNotice(perm: PushPerm, asked: boolean, hasSignals: boolean, iosTab = false): 'install' | 'default' | 'denied' | null {
    if (!hasSignals) return null;
    if (iosTab) return 'install';
    if (perm === 'denied') return 'denied';
    if (perm === 'default' && asked) return 'default';
    return null;
}

function waitUpTo(p: Promise<unknown>, ms: number): Promise<void> {
    return new Promise((resolve) => {
        const t = setTimeout(resolve, ms);
        const done = () => {
            clearTimeout(t);
            resolve();
        };
        p.then(done, done);
    });
}

export type {PushPerm};

export {
    pushNotice,
    waitUpTo,
    urlBase64ToUint8Array,
    sameKey,
    isIos,
    navHash,
}
