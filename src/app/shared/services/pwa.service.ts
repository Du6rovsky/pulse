import type {PushSubData} from "@shared";
import {isIos, navHash, sameKey, urlBase64ToUint8Array, waitUpTo} from "../../core/utils/push.util";
import {installGate, installTarget, type InstallTarget} from "../../core/utils/install.util";
import {changeHash} from "../../core/utils/toolbox.util";
import {me} from "../../core/store/me.svelte";
import {push} from "../../core/store/push.svelte";
import {install} from "../../core/store/install.svelte";
import {request} from "../../core/utils/ws.util";
import {checkPay} from "./pay.service";
import {registerSW} from 'virtual:pwa-register';
import {getResub, setResub} from "../../../sw/resub";

const ASKED_KEY = 'pushAsked';
const ASKED_APP_KEY = 'pushAskedApp';
const INSTALL_HINT_KEY = 'installHint';
const PUSH_WAIT_MS = 10_000;
const UPDATE_CHECK_MS = 3_600_000;

type InstallPromptEvent = Event & {
    prompt(): Promise<void>;
    userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
};

type RelatedAppsNavigator = Navigator & {
    getInstalledRelatedApps?: () => Promise<unknown[]>;
};

let syncing: Promise<void> | null = null;
let installEvent: InstallPromptEvent | null = null;
let registration: ServiceWorkerRegistration | undefined;

function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function readFlag(key: string): boolean {
    try {
        return localStorage.getItem(key) === '1';
    } catch {
        return false;
    }
}

function setFlag(key: string): void {
    try {
        localStorage.setItem(key, '1');
    } catch {
    }
}

function askedKey(): string {
    return isInstalled() ? ASKED_APP_KEY : ASKED_KEY;
}

function refreshPush(): void {
    push.perm = isPushSupported() ? Notification.permission : 'unsupported';
    push.asked = readFlag(askedKey());
}

function toSubData(sub: PushSubscription): PushSubData {
    const {keys} = sub.toJSON();
    return {endpoint: sub.endpoint, keys: {p256dh: keys?.p256dh ?? '', auth: keys?.auth ?? ''}};
}

function syncPush(): Promise<void> {
    if (!isPushSupported() || Notification.permission !== 'granted' || !me.vapidPublic) return Promise.resolve();
    syncing ??= sendSub().finally(() => {
        syncing = null;
    });
    return syncing;
}

async function sendSub(): Promise<void> {
    try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (sub && !sameKey(sub.options?.applicationServerKey, me.vapidPublic)) {
            await sub.unsubscribe();
            sub = null;
        }
        sub ??= await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(me.vapidPublic),
        });

        await request('push.sub', toSubData(sub));
        if (await getResub()) await setResub(false);
    } catch {
        console.warn('Push subscription sync failed');
    }
}

async function askPush(): Promise<void> {
    if (!isPushSupported()) return;
    try {
        const key = askedKey();
        if (Notification.permission === 'default' && !readFlag(key)) {
            setFlag(key);
            await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') await waitUpTo(syncPush(), PUSH_WAIT_MS);
    } catch {
    } finally {
        refreshPush();
    }
}

async function enablePush(): Promise<void> {
    if (!isPushSupported()) return;
    try {
        if (await Notification.requestPermission() === 'granted') void syncPush();
    } catch {
    } finally {
        refreshPush();
    }
}

function isInstalled(): boolean {
    return matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & {standalone?: boolean}).standalone === true;
}

function iosTab(): boolean {
    return isIos(navigator.userAgent, navigator.platform, navigator.maxTouchPoints) && !isInstalled();
}

function deviceInstallTarget(): InstallTarget {
    return installTarget(navigator.userAgent, navigator.platform, navigator.maxTouchPoints, install.canPrompt);
}

function needInstallHint(): boolean {
    return !isInstalled() && deviceInstallTarget() !== null && !readFlag(INSTALL_HINT_KEY);
}

function setInstallHintShown(): void {
    setFlag(INSTALL_HINT_KEY);
}

function needInstallGate(): boolean {
    return installGate(navigator.userAgent, navigator.platform, navigator.maxTouchPoints, {
        installed: isInstalled(),
        canPrompt: install.canPrompt,
        done: install.done,
        hinted: readFlag(INSTALL_HINT_KEY),
    });
}

function watchInstall(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        installEvent = e as InstallPromptEvent;
        install.canPrompt = true;
        install.ready = true;
    });
    window.addEventListener('appinstalled', () => {
        installEvent = null;
        install.ready = false;
        install.done = true;
    });
    (navigator as RelatedAppsNavigator).getInstalledRelatedApps?.()
        .then((apps) => {
            if (apps.length > 0) install.done = true;
        })
        .catch(() => {
        });
}

async function promptInstall(): Promise<void> {
    const e = installEvent;
    if (!e) return;
    installEvent = null;
    install.ready = false;
    try {
        await e.prompt();
        if ((await e.userChoice).outcome === 'accepted') install.done = true;
    } catch {
    }
}

function checkUpdate(): void {
    registration?.update().catch(() => {});
}

function startPwaFlow() {
    refreshPush();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        refreshPush();
        if (push.perm === 'granted') void syncPush();
        void checkPay();
        checkUpdate();
    });

    if (!('serviceWorker' in navigator)) return;

    registerSW({onRegisteredSW: (_url, r) => registration = r});
    setInterval(checkUpdate, UPDATE_CHECK_MS);

    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{t?: string, url?: string}>) => {
        if (event.data?.t !== 'nav') return;
        const page = navHash(event.data.url);
        if (page) changeHash(page);
    });
}

export {
    startPwaFlow,
    syncPush,
    askPush,
    enablePush,
    isInstalled,
    iosTab,
    deviceInstallTarget,
    needInstallHint,
    setInstallHintShown,
    needInstallGate,
    watchInstall,
    promptInstall,
};
