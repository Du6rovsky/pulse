import {KEY_LENGTH, P_PCT, RATES_S, STRATEGIES, type MeData} from "@shared";

export const QR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const QR_MAX_BYTES = 20 * 1024 * 1024;
export const QR_MAX_SIDE = 1500;

export interface CompareRow {
    label: string;
    free: string;
    pro: string;
}

export function compareRows(limits: MeData['limits']): CompareRow[] {
    const {free, pro} = limits;
    return [
        {label: 'ACC_SIGNALS', free: String(free.signals), pro: String(pro.signals)},
        {label: 'ACC_STRATEGIES', free: String(free.strategies.length), pro: `Все ${STRATEGIES.length}`},
        {label: 'ACC_MULTI', free: free.modes.length > 1 ? 'Есть' : '—', pro: 'Есть'},
        {label: 'ACC_PCT', free: free.pctPeriods.join(' '), pro: `${P_PCT[0]}–${P_PCT[P_PCT.length - 1]}`},
        {label: 'ACC_RATES', free: `${RATES_S.free} с`, pro: `${RATES_S.pro} с`},
    ];
}

export function fileError(file: {type: string; size: number}): string | null {
    if (!QR_TYPES.includes(file.type)) return 'RK_FILE_TYPE';
    if (file.size > QR_MAX_BYTES) return 'RK_FILE_SIZE';
    return null;
}

export function canLogin(input: string, online: boolean, locked: boolean, busy: boolean): boolean {
    return input.replace(/-/g, '').length === KEY_LENGTH && online && !locked && !busy;
}

export function fitSize(w: number, h: number, max: number = QR_MAX_SIDE): {w: number; h: number} {
    const k = Math.min(1, max / Math.max(w, h));
    return {w: Math.round(w * k), h: Math.round(h * k)};
}
