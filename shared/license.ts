export const KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const KEY_LENGTH = 25;
export const KEY_BYTES = 15;

export type LicErrCode = "LIC_NOT_FOUND" | "LIC_BAD_FORMAT" | "LIC_TOO_MANY" | "LIC_DEVICE_LIMIT" | "LIC_NOT_PRO";

export const LIC_MESSAGES: Record<LicErrCode, string> = {
    LIC_NOT_FOUND: "Ключ не найден.",
    LIC_BAD_FORMAT: "Ключ введён с ошибкой. Проверьте символы.",
    LIC_TOO_MANY: "Слишком много попыток. Повторите позже.",
    LIC_DEVICE_LIMIT: "Ключ уже переносили на другое устройство 3 раза за сутки. Повторите завтра.",
    LIC_NOT_PRO: "PRO уже отключён.",
};

export function normalizeKey(raw: string): string {
    return raw.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
}

export function formatKey(key: string): string {
    return key.match(/.{1,5}/g)?.join("-") ?? "";
}

async function checkChar(data: string): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)));
    return KEY_ALPHABET[digest[0] & 31];
}

export async function keyFromBytes(bytes: Uint8Array): Promise<string> {
    if (bytes.length !== KEY_BYTES) throw new Error(`expected ${KEY_BYTES} bytes`);
    let data = "";
    let acc = 0;
    let bits = 0;
    for (const b of bytes) {
        acc = (acc << 8) | b;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            data += KEY_ALPHABET[(acc >> bits) & 31];
        }
        acc &= (1 << bits) - 1;
    }
    return formatKey(data + await checkChar(data));
}

export async function checkKey(raw: string): Promise<string | null> {
    const key = normalizeKey(raw);
    if (key.length !== KEY_LENGTH || [...key].some((c) => !KEY_ALPHABET.includes(c))) return null;
    return key.at(-1) === await checkChar(key.slice(0, -1)) ? key : null;
}
