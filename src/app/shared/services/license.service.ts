import {checkKey, formatKey, LIC_MESSAGES, type ErrData, type MeData, type PlanId} from "@shared";
import {keyFromPngBytes, looksLikeKey, pngWithKey, qrModules, QR_MARGIN, resolveKey} from "../../core/utils/license.util";
import {fitSize} from "../../core/utils/access.util";
import {isIos} from "../../core/utils/push.util";
import {request} from "../../core/utils/ws.util";
import {cache} from "../../core/utils/cache.util";
import {changeHash} from "../../core/utils/toolbox.util";
import {ePages} from "../../core/entities/pages.enum";
import {me, pro, setMe} from "../../core/store/me.svelte";
import {loadSignals, signals} from "../../core/store/signals.svelte";
import {access} from "../../core/store/access.svelte";
import {syncPush} from "./pwa.service";

interface BarcodeDetectorLike {
    detect(src: CanvasImageSource): Promise<{rawValue: string}[]>;
}
type BarcodeDetectorCtor = new (o: {formats: string[]}) => BarcodeDetectorLike;

const KEY_STORAGE = 'pro.key';
const PNG_NAME = 'signal-pro-key.png';
const CELL = 10;
const CAPTION = 50;
const FONT = 'bold 18px ui-monospace, "SF Mono", "SFMono-Regular", "Menlo", "Consolas", "DejaVu Sans Mono", monospace';

function getKey(): string | null {
    try {
        return localStorage.getItem(KEY_STORAGE);
    } catch {
        return null;
    }
}

function saveKey(key: string): void {
    try {
        localStorage.setItem(KEY_STORAGE, key);
    } catch {
    }
}

function forgetKey(): void {
    try {
        localStorage.removeItem(KEY_STORAGE);
    } catch {
    }
}

async function activateByKey(raw: string): Promise<void> {
    const ok = await checkKey(raw);
    if (!ok) throw {code: 'LIC_BAD_FORMAT', message: LIC_MESSAGES.LIC_BAD_FORMAT} satisfies ErrData;

    const key = formatKey(ok);
    const d = await request<MeData>('lic.activate', {key});
    saveKey(key);
    setMe(d);
    await loadSignals();
    void syncPush();
}

async function decodeQr(file: File): Promise<string | null> {
    const bmp = await createImageBitmap(file);
    const {w, h} = fitSize(bmp.width, bmp.height);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', {willReadFrequently: true});
    g.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const Detector = (globalThis as {BarcodeDetector?: BarcodeDetectorCtor}).BarcodeDetector;
    if (Detector) {
        const codes = await new Detector({formats: ['qr_code']}).detect(c);
        return codes[0]?.rawValue ?? null;
    }
    const {default: jsQR} = await import('jsqr');
    return jsQR(g.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
}

async function keyFromFile(file: File): Promise<string | null> {
    if (file.type === 'image/png') {
        const k = keyFromPngBytes(new Uint8Array(await file.arrayBuffer()));
        if (k) return k;
    }
    try {
        const text = await decodeQr(file);
        return text && looksLikeKey(text) ? text.trim() : null;
    } catch {
        return null;
    }
}

function onRevoked(): void {
    forgetKey();
    cache.clearSignals();
    signals.list = [];
    Object.assign(me, {pro: false, paidUntil: null, plan: null});
    pro.pendingCreate = false;
    access.revoked++;
    access.sheet = 'revoked';
    changeHash(ePages.SIGNALS);
}

async function ensureKey(plan: PlanId): Promise<string> {
    const key = await resolveKey(getKey(), async () => (await request<{key: string}>('lic.issue', {plan})).key);
    saveKey(key);
    return key;
}

function iosShare(): boolean {
    return isIos(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
}

function canDownload(): boolean {
    if (iosShare()) {
        return !!navigator.canShare?.({files: [new File([], PNG_NAME, {type: 'image/png'})]});
    }
    return 'download' in HTMLAnchorElement.prototype;
}

function keyPng(key: string): Promise<File> {
    const m = qrModules(key);
    const w = (m.length + QR_MARGIN * 2) * CELL;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = w + CAPTION;

    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    m.forEach((row, y) => row.forEach((dark, x) => {
        if (dark) g.fillRect((x + QR_MARGIN) * CELL, (y + QR_MARGIN) * CELL, CELL, CELL);
    }));
    g.font = FONT;
    g.textAlign = 'center';
    g.fillText(key, w / 2, w + 30);

    return new Promise((resolve, reject) => c.toBlob(async (blob) => {
        if (!blob) return reject(new Error('toBlob'));
        resolve(new File([await pngWithKey(blob, key)], PNG_NAME, {type: 'image/png'}));
    }, 'image/png'));
}

async function saveKeyPng(file: File): Promise<void> {
    if (iosShare()) {
        await navigator.share({files: [file]}).catch(() => {});
        return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = PNG_NAME;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url));
}

export {
    getKey,
    ensureKey,
    activateByKey,
    keyFromFile,
    onRevoked,
    canDownload,
    keyPng,
    saveKeyPng,
}
