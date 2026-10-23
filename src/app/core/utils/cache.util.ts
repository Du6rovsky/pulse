import type {Market, RateRow, RatesData, SignalRecord} from "@shared";

export const CACHE_KEY = 'cache.v1';

const SIGNALS_EVERY_MS = 2000;
const RATES_EVERY_MS = 30_000;

export type Rate = [string, ...RateRow];

export interface CacheData {
    signals: SignalRecord[];
    rates: Record<Market, Rate[]>;
    ratesAt: Record<Market, number>;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function empty(): CacheData {
    return {signals: [], rates: {spot: [], perp: []}, ratesAt: {spot: 0, perp: 0}};
}

function local(): Store | null {
    try {
        return localStorage;
    } catch {
        return null;
    }
}

export function readCache(store: Store | null): CacheData {
    try {
        const v = JSON.parse(store?.getItem(CACHE_KEY) ?? 'null') as CacheData | null;
        if (!v || !Array.isArray(v.signals) || !v.rates || !v.ratesAt) return empty();
        return v;
    } catch {
        return empty();
    }
}

export function toRates(d: RatesData): Record<Market, Rate[]> {
    const list = (rows: Record<string, RateRow> | undefined) =>
        Object.entries(rows ?? {}).map(([base, row]): Rate => [base, ...row]);
    return {spot: list(d.spot), perp: list(d.perp)};
}

export function fromRates(list: Rate[]): Record<string, RateRow> {
    const out: Record<string, RateRow> = {};
    for (const [base, ...row] of list ?? []) out[base] = row;
    return out;
}

export function cachedAt(c: CacheData): number | null {
    return Math.max(c.ratesAt.spot ?? 0, c.ratesAt.perp ?? 0) || null;
}

function throttle<T>(ms: number, write: (v: T) => void) {
    let last = -Infinity;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let value: T;

    function flush() {
        timer = null;
        last = Date.now();
        write(value);
    }

    return {
        push(v: T) {
            value = v;
            if (timer) return;
            const wait = last + ms - Date.now();
            if (wait <= 0) flush();
            else timer = setTimeout(flush, wait);
        },
        cancel() {
            if (timer) clearTimeout(timer);
            timer = null;
        },
    };
}

export function createCache(store: Store | null) {
    const data = readCache(store);

    function write() {
        try {
            store?.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
        }
    }

    const signals = throttle<SignalRecord[]>(SIGNALS_EVERY_MS, v => {
        data.signals = v;
        write();
    });
    const rates = throttle<{d: RatesData; at: number}>(RATES_EVERY_MS, ({d, at}) => {
        data.rates = toRates(d);
        data.ratesAt = {spot: at, perp: at};
        write();
    });

    return {
        data,
        saveSignals: (list: SignalRecord[]) => signals.push(list),
        saveRates: (d: RatesData, at: number) => rates.push({d, at}),
        clearSignals() {
            signals.cancel();
            data.signals = [];
            write();
        },
    };
}

export const cache = createCache(local());
