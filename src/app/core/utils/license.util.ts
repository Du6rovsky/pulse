import {checkKey, formatKey, KEY_ALPHABET, KEY_LENGTH, normalizeKey} from "@shared";
import qrcode from "qrcode-generator";

export const PNG_KEY_WORD = 'signal-key';
export const QR_MARGIN = 4;

let crcTable: Uint32Array | null = null;

export function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let x = 0xFFFFFFFF;
    for (const b of bytes) x = crcTable[(x ^ b) & 255] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
}

export async function pngWithKey(blob: Blob, key: string): Promise<Blob> {
    const src = new Uint8Array(await blob.arrayBuffer());
    const text = new TextEncoder().encode(`${PNG_KEY_WORD}\0${key}`);
    const body = new Uint8Array(4 + text.length);
    body.set([0x74, 0x45, 0x58, 0x74]);
    body.set(text, 4);

    const chunk = new Uint8Array(12 + text.length);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, text.length);
    chunk.set(body, 4);
    dv.setUint32(8 + text.length, crc32(body));

    const iend = src.length - 12;
    const out = new Uint8Array(src.length + chunk.length);
    out.set(src.subarray(0, iend));
    out.set(chunk, iend);
    out.set(src.subarray(iend), iend + chunk.length);
    return new Blob([out], {type: 'image/png'});
}

export function keyInput(raw: string): string {
    const key = [...normalizeKey(raw)].filter(c => KEY_ALPHABET.includes(c)).join('').slice(0, KEY_LENGTH);
    return formatKey(key);
}

export function looksLikeKey(text: string): boolean {
    const key = normalizeKey(text.trim());
    return key.length === KEY_LENGTH && [...key].every(c => KEY_ALPHABET.includes(c));
}

export function keyFromPngBytes(u: Uint8Array): string | null {
    const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (u.length < 8 || PNG_SIG.some((b, i) => u[i] !== b)) return null;

    const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
    const latin1 = new TextDecoder('latin1');
    for (let p = 8; p + 12 <= u.length;) {
        const len = dv.getUint32(p);
        const type = latin1.decode(u.subarray(p + 4, p + 8));
        if (type === 'IEND') break;
        if (type === 'tEXt') {
            const text = latin1.decode(u.subarray(p + 8, p + 8 + len));
            const z = text.indexOf('\0');
            if (text.slice(0, z) === PNG_KEY_WORD) return text.slice(z + 1);
        }
        p += 12 + len;
    }
    return null;
}

export async function resolveKey(stored: string | null, issue: () => Promise<string>): Promise<string> {
    const own = stored ? await checkKey(stored) : null;
    if (own) return formatKey(own);

    const key = await checkKey(await issue());
    if (!key) throw new Error('bad key');
    return formatKey(key);
}

export function qrModules(text: string, mode: 'Alphanumeric' | 'Byte' = 'Alphanumeric'): boolean[][] {
    const qr = qrcode(0, 'M');
    qr.addData(text, mode);
    qr.make();
    const n = qr.getModuleCount();
    return Array.from({length: n}, (_r, y) => Array.from({length: n}, (_c, x) => qr.isDark(y, x)));
}

export function qrPath(modules: boolean[][]): string {
    let d = '';
    modules.forEach((row, y) => row.forEach((dark, x) => {
        if (dark) d += `M${x + QR_MARGIN} ${y + QR_MARGIN}h1v1h-1z`;
    }));
    return d;
}
