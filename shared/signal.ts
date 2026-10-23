import {MARKETS, MODES, type Market, type Mode} from './markets.js';
import type {Dir} from './notification.js';
import {P_PCT, type Period} from './periods.js';
import {FUND_MAX, FUND_MIN, strategiesFor, type StrategyId} from './strategies.js';

export type SignalKind = 'price' | 'pct' | 'strat';

export interface RatioLevel {
    level: number;
    dir: 'above' | 'below';
}

export interface SignalConfig {
    market: Market;
    mode: Mode;
    coins: string[];
    kind: SignalKind;
    stratId?: StrategyId;
    period?: Period;
    threshold?: number;
    levels?: RatioLevel[];
    target?: number;
    dir?: Dir;
    pct?: number;
    abs?: boolean;
    repeat: boolean;
}

export interface SignalRecord extends SignalConfig {
    id: string;
    createdAt: number;
    hits: number;
    lastHitAt: number | null;
    paused: boolean;
}

export type ConfigError =
    'market' | 'mode' | 'coins' | 'kind' | 'strat' | 'period' | 'threshold' | 'levels' | 'target' | 'pct' | 'repeat';

export type ValidateResult = {ok: true} | {ok: false; error: ConfigError};

export const PCT_MIN = -25;
export const PCT_MAX = 25;
export const PCT_STEP = 0.5;

const KINDS: readonly SignalKind[] = ['price', 'pct', 'strat'];
const TICKER = /^[A-Z0-9]+$/;

function isThreshold(x: unknown): boolean {
    return typeof x === 'number' && Number.isFinite(x) && x >= FUND_MIN && x <= FUND_MAX
        && Math.abs(Math.round(x * 100) - x * 100) < 1e-9;
}

function isLevels(v: unknown, mode: Mode): boolean {
    return Array.isArray(v) && v.length === mode - 1 && v.every((l: Partial<RatioLevel> | null) =>
        typeof l === 'object' && l !== null && typeof l.level === 'number' && Number.isFinite(l.level) && l.level > 0
        && (l.dir === 'above' || l.dir === 'below'));
}

export function validateConfig(c: SignalConfig): ValidateResult {
    const fail = (error: ConfigError): ValidateResult => ({ok: false, error});

    if (!MARKETS.includes(c.market)) return fail('market');
    if (!MODES.includes(c.mode)) return fail('mode');
    if (!Array.isArray(c.coins) || c.coins.length !== c.mode
        || !c.coins.every(t => typeof t === 'string' && TICKER.test(t))
        || new Set(c.coins).size !== c.coins.length) return fail('coins');
    if (!KINDS.includes(c.kind) || (c.kind !== 'strat' && c.mode !== 1)) return fail('kind');
    if (typeof c.repeat !== 'boolean') return fail('repeat');

    if (c.kind !== 'strat' && c.stratId !== undefined) return fail('strat');
    if (c.kind !== 'price' && (c.target !== undefined || c.dir !== undefined)) return fail('target');
    if (c.kind !== 'pct' && (c.pct !== undefined || c.abs !== undefined)) return fail('pct');
    if (c.kind === 'price' && c.period !== undefined) return fail('period');

    if (c.kind === 'price') {
        if (typeof c.target !== 'number' || !Number.isFinite(c.target) || c.target <= 0
            || (c.dir !== 'up' && c.dir !== 'down')) return fail('target');
    }

    if (c.kind === 'pct') {
        if (!P_PCT.some(p => p === c.period)) return fail('period');
        if (c.abs !== undefined && typeof c.abs !== 'boolean') return fail('pct');
        const v = c.pct;
        if (typeof v !== 'number' || !Number.isFinite(v) || v === 0 || v < PCT_MIN || v > PCT_MAX
            || !Number.isInteger(v / PCT_STEP) || (c.abs && v < 0)) return fail('pct');
    }

    if (c.kind === 'strat') {
        const s = strategiesFor(c.market, c.mode).find(x => x.id === c.stratId);
        if (!s) return fail('strat');
        if (s.id === 'fund' ? !isThreshold(c.threshold) : c.threshold !== undefined) return fail('threshold');
        if (s.id === 'ratio' ? !isLevels(c.levels, c.mode) : c.levels !== undefined) return fail('levels');
        const ok = s.periods ? s.periods.some(p => p === c.period) : c.period === undefined;
        if (!ok) return fail('period');
    } else {
        if (c.threshold !== undefined) return fail('threshold');
        if (c.levels !== undefined) return fail('levels');
    }

    return {ok: true};
}
