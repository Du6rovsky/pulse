export type Market = 'spot' | 'perp';
export type Mode = 1 | 2 | 3;

export const MARKETS: readonly Market[] = ['spot', 'perp'];
export const MODES: readonly Mode[] = [1, 2, 3];

export const MODE_LABELS: Record<Market, readonly [string, string, string]> = {
    spot: ['1 спот', '2 спота', '3 спота'],
    perp: ['1 фьючерс', '2 фьючерса', '3 фьючерса'],
};

export const QUOTE_LABEL: Record<Market, string> = {spot: 'USDT', perp: 'USDT Perp'};

export const ROLE_LABELS: Record<Mode, readonly string[]> = {
    1: [],
    2: ['Лидер', 'Ведомый'],
    3: ['Лидер', 'Ведомый 1', 'Ведомый 2'],
};

export const PERP_SUFFIX = '.P';
