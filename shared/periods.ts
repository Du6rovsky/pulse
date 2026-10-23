export type Period = '5m' | '15m' | '30m' | '1h' | '4h' | '24h';

export const PERIOD_MIN: Record<Period, number> = {
    '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '24h': 1440,
};

export const W = ['5m', '15m', '30m', '1h', '4h'] as const;
export const P_PCT = [...W, '24h'] as const;
export const P_FAKE = ['5m', '15m', '30m', '1h'] as const;
export const P_RS = [...W, '24h'] as const;
export const P_CORR = ['1h', '4h', '24h'] as const;

export const DEFAULT_PERIOD: Period = '15m';

export function coercePeriod<T extends string>(value: string | undefined, list: readonly T[], def: string = DEFAULT_PERIOD): T {
    const found = list.find(p => p === value) ?? list.find(p => p === def);
    return found ?? list[0];
}
