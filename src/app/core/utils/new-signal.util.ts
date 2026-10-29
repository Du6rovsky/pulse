import {
    coercePeriod, MINUS, PERP_SUFFIX, P_PCT, ratioNum, renderNotification, repeatLabel, strategiesFor, validateConfig,
    FUND_DEFAULT, FUND_MAX, FUND_MIN, FUND_STEP, fundLabel, FREE, needPro, PLAN_NAMES, planDiscount, planPerMonth, type Plan, type PlanId, type Market, type Mode, type RateRow, type NotifyEvent,
    type Dir, type Period, type RatioLevel, type SignalConfig, type SignalKind, type Strategy, type StrategyId,
} from "@shared";

export interface Ticker {
    symbol: string;
    lastPrice: string;
    price24hPcnt: string;
    turnover24h: string;
}

export interface NewSignalState {
    market: Market;
    mode: Mode;
    tab: SignalKind;
    slots: string[];
    strat: {single: StrategyId; multi: StrategyId};
    period: Period;
    fth: number;
    target: string;
    targetFor: string;
    pct: number;
    abs: boolean;
    pctPeriod: Period;
    repeat: Record<SignalKind, boolean>;
    levels: string[];
    levelsFor: string[];
}

export interface Preview {
    l1: string;
    l2: string;
    dim: boolean;
}

export const DEFAULT_STRAT = {single: 'brk', multi: 'rs'} as const;

export function defaults(): NewSignalState {
    return {
        market: 'spot', mode: 1, tab: 'strat', slots: ['BTC', 'ETH', 'SOL'],
        strat: {...DEFAULT_STRAT}, period: '15m', fth: FUND_DEFAULT,
        target: '', targetFor: 'BTC', pct: 5, abs: false, pctPeriod: '24h',
        repeat: {price: false, pct: true, strat: true},
        levels: ['', ''], levelsFor: ['', ''],
    };
}

export function fromRows(rows: Record<string, RateRow>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [base, [lastPrice, price24hPcnt, turnover24h]] of Object.entries(rows ?? {})) {
        const symbol = base + 'USDT';
        out[symbol] = JSON.stringify({symbol, lastPrice, price24hPcnt, turnover24h} satisfies Ticker);
    }
    return out;
}

export function parseRates(rates: Record<string, string>): Ticker[] {
    return Object.values(rates ?? {})
        .map(v => JSON.parse(v) as Ticker)
        .sort((a, b) => +b.turnover24h - +a.turnover24h);
}

export function baseTicker(symbol: string): string {
    return symbol.replace('USDT', '');
}

export function kindOf(s: NewSignalState): SignalKind {
    return s.mode === 1 ? s.tab : 'strat';
}

export function activeSlots(s: NewSignalState): string[] {
    return s.slots.slice(0, s.mode);
}

export function strategy(s: NewSignalState): Strategy {
    const list = strategiesFor(s.market, s.mode);
    const group = s.mode === 1 ? 'single' : 'multi';
    return list.find(x => x.id === s.strat[group]) ?? list.find(x => x.id === DEFAULT_STRAT[group]) ?? list[0];
}

export function stratPeriod(s: NewSignalState): string {
    return periodOf(s, strategy(s));
}

export function periodOf(s: NewSignalState, st: Strategy): string {
    if (st.id === 'fund') return fundLabel(s.fth);
    if (!st.periods) return st.fixed ?? '';
    return coercePeriod(s.period, st.periods);
}

export function applyStrategy(s: NewSignalState, id: StrategyId): void {
    s.strat[s.mode === 1 ? 'single' : 'multi'] = id;
    const st = strategy(s);
    if (st.periods) s.period = coercePeriod(s.period, st.periods);
}

export function applyStratParam(s: NewSignalState, v: string): void {
    s.period = v as Period;
}

export function clampFund(v: number): number {
    return Math.min(FUND_MAX, Math.max(FUND_MIN, Math.round(v * 100) / 100));
}

export function stepFund(v: number, d: 1 | -1): number {
    return clampFund(v + d * FUND_STEP);
}

export function parseTarget(v: string): number {
    const t = String(v).replace(',', '.');
    if (!t || t === '.' || !/^\d*\.?\d*$/.test(t)) return NaN;
    return parseFloat(t);
}

export function normalizeTarget(v: string): string {
    return String(v ?? '').replace(/[^0-9.,]/g, '');
}

export function isTargetError(v: string): boolean {
    return v !== '' && !(parseTarget(v) > 0);
}

export function defaultTarget(price: string): string {
    const x = +price * 1.06;
    if (!(x > 0)) return '';
    const mag = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    const k = Math.ceil(Number((x / mag).toFixed(9)));
    return String(Number((k * mag).toPrecision(2)));
}

export function applyAbs(s: NewSignalState, abs: boolean): void {
    s.abs = abs;
    if (abs && s.pct < 0) s.pct = -s.pct;
}

export function ratioDir(level: number, ratio: number): RatioLevel['dir'] {
    return level < ratio ? 'below' : 'above';
}

export function ratiosOf(prices: (string | undefined)[]): number[] {
    return prices.slice(1).map(p => +(p || NaN) / +(prices[0] || NaN));
}

export function levelLabel(st: Strategy, leader: string, follower: string): string {
    return st.paramLabel.replace('{B}', follower).replace('{A}', leader);
}

export function priceDir(target: number, price: string): Dir {
    return target < +price ? 'down' : 'up';
}

export function toConfig(s: NewSignalState, ratios: number[] = [], price = ''): SignalConfig {
    const kind = kindOf(s);
    const base = {market: s.market, mode: s.mode, coins: activeSlots(s), kind, repeat: s.repeat[kind]};

    if (kind === 'price') {
        const target = parseTarget(s.target);
        return {...base, target, dir: priceDir(target, price)};
    }
    if (kind === 'pct') return {...base, pct: s.pct, abs: s.abs, period: s.pctPeriod};

    const st = strategy(s);
    if (st.id === 'fund') return {...base, stratId: st.id, threshold: s.fth};
    if (st.id === 'ratio') {
        const levels = s.levels.slice(0, s.mode - 1).map((v, i) => {
            const level = parseTarget(v);
            return {level, dir: ratioDir(level, ratios[i])};
        });
        return {...base, stratId: st.id, levels};
    }
    return {...base, stratId: st.id, period: st.periods ? stratPeriod(s) as Period : undefined};
}

export function fixSlots(slots: string[], mode: Mode, available: string[]): string[] {
    const out: string[] = [];
    slots.forEach((t, i) => {
        const onMarket = available.length === 0 || available.includes(t);
        const repeated = i < mode && out.slice(0, mode).includes(t);
        if (onMarket && !repeated) {
            out.push(t);
            return;
        }
        const pool = available.length ? available : slots;
        const free = pool.find(c => !out.includes(c) && !slots.slice(i + 1).includes(c));
        out.push(free ?? t);
    });
    return out;
}

export function applyMarket(s: NewSignalState, market: Market, available: string[]): void {
    s.market = market;
    s.slots = fixSlots(s.slots, s.mode, available);
    if (!strategiesFor(market, 1).some(x => x.id === s.strat.single)) s.strat.single = DEFAULT_STRAT.single;
}

export function applyMode(s: NewSignalState, mode: Mode, available: string[]): void {
    s.mode = mode;
    s.slots = fixSlots(s.slots, mode, available);
}

export function ensureLevels(s: NewSignalState, priceOf: (t: string) => string | undefined): void {
    const leader = s.slots[0];
    s.slots.slice(1).forEach((t, i) => {
        const key = `${s.market}:${leader}/${t}`;
        const ratio = +(priceOf(t) ?? NaN) / +(priceOf(leader) ?? NaN);
        if (s.levelsFor[i] === key || !(ratio > 0) || !Number.isFinite(ratio)) return;
        s.levelsFor[i] = key;
        s.levels[i] = ratioNum(ratio * 1.02);
    });
}

export function isLevelsOk(s: NewSignalState): boolean {
    return s.levels.slice(0, s.mode - 1).every(v => parseTarget(v) > 0);
}

export function canCreate(s: NewSignalState, ratios: number[] = []): boolean {
    if (kindOf(s) === 'strat' && strategy(s).id === 'ratio' && !isLevelsOk(s)) return false;
    return validateConfig(toConfig(s, ratios)).ok;
}

export function restoreState(saved: Partial<Record<keyof NewSignalState, unknown>>): NewSignalState {
    const def = defaults();
    const s = {...def, ...saved} as NewSignalState;
    const ids = (mode: Mode): string[] => strategiesFor('perp', mode).map(x => x.id);

    s.strat = {...def.strat, ...(saved.strat as Partial<NewSignalState['strat']>)};
    if (!ids(1).includes(s.strat.single)) s.strat.single = DEFAULT_STRAT.single;
    if (!ids(2).includes(s.strat.multi)) s.strat.multi = DEFAULT_STRAT.multi;
    s.period = coercePeriod(String(s.period), P_PCT);
    s.pctPeriod = coercePeriod(String(s.pctPeriod), P_PCT, def.pctPeriod);

    const fth: unknown = saved.fth;
    const n = typeof fth === 'string' ? parseFloat(fth.replace('±', '').replace('%', '')) : fth;
    s.fth = typeof n === 'number' && n > 0 ? n : FUND_DEFAULT;
    if (!Array.isArray(s.levels)) s.levels = def.levels;
    if (!Array.isArray(s.levelsFor)) s.levelsFor = def.levelsFor;
    return s;
}

export function repeatCaption(s: NewSignalState): string {
    return repeatLabel(toConfig(s));
}

export function cleanNum(n: number): string {
    return String(Number(n.toFixed(6)));
}

export function pctText(v: number, abs: boolean): string {
    if (v === 0) return '0%';
    const a = Math.abs(v);
    return (abs ? '±' : v < 0 ? MINUS : '+') + (Number.isInteger(a) ? String(a) : a.toFixed(1)) + '%';
}

const AGO: Partial<Record<Period, string>> = {
    '5m': '5 минут', '15m': '15 минут', '30m': '30 минут', '1h': '1 час', '4h': '4 часа', '24h': '24 часа',
};

export function pctAgoText(p: Period): string {
    return `Сравнивается с ценой ${AGO[p] ?? p} назад`;
}

function decimals(price: string): number {
    return (price.split('.')[1] ?? '').length;
}

function px(price: string, k: number): string {
    return (+price * k).toFixed(decimals(price));
}

export function exampleEvent(s: NewSignalState, price: string, ratios: number[]): NotifyEvent | null {
    const st = strategy(s);
    const coins = activeSlots(s);
    const p = stratPeriod(s) as Period;
    const follower = coins[coins.length - 1];
    const base = {market: s.market, coins};

    switch (st.id) {
        case 'brk': return {...base, type: 'brk', dir: 'up', level: px(price, 0.9996), volRatio: 2.4};
        case 'fake': return {...base, type: 'fake', dir: 'down', level: px(price, 1.003), elapsedMin: p === '5m' ? 3 : 6};
        case 'vol': return {...base, type: 'vol', period: p, volRatio: 4.2, change: 0.6};
        case 'vwap': return {...base, type: 'vwap', dir: 'up', price: px(price, 1), vwap: px(price, 0.996)};
        case 'oi': return {...base, type: 'oi', period: p, oiChange: 4.2, change: 0.8};
        case 'rsi': return {...base, type: 'rsi', period: p, rsi: 72.4, price: px(price, 1)};
        case 'fund': return {...base, type: 'fund', rate: Number((s.fth * 1.6).toFixed(3)), payInMin: 4};
        case 'liq': return {...base, type: 'liq', period: p, side: 'long', sum: 4.2e6, usual: 0.6e6, change: -1.4};
        case 'rs': return {...base, type: 'rs', period: p, follower, stronger: true, changes: s.mode === 3 ? [0.5, 0.7, 2.6] : [0.5, 2.6]};
        case 'ratio': {
            const level = parseTarget(s.levels[0]);
            if (!(level > 0)) return null;
            return {...base, type: 'ratio', follower: coins[1], dir: ratioDir(level, ratios[0]), level};
        }
        case 'dec': return {...base, type: 'dec', period: p, follower, rho: 0.38, rhoUsual: 0.84};
    }
}

export function preview(s: NewSignalState, price: string, ratios: number[] = []): Preview {
    const kind = kindOf(s);
    const coins = activeSlots(s);

    if (kind === 'price') {
        const v = parseTarget(s.target);
        if (!(v > 0)) return {dim: true, l1: 'Введите цену цели', l2: 'Здесь появится текст уведомления'};
        const n = renderNotification({market: s.market, coins, type: 'price', dir: priceDir(v, price), target: cleanNum(v)});
        return {dim: false, l1: n.title, l2: n.body};
    }

    if (kind === 'pct') {
        if (s.pct === 0) return {dim: true, l1: 'Задайте изменение цены', l2: 'При 0% сигнал не сработает'};
        const n = renderNotification({
            market: s.market, coins, type: 'pct', period: s.pctPeriod, change: s.pct,
            priceFrom: px(price, 1), priceTo: px(price, 1 + s.pct / 100),
        });
        return {dim: false, l1: n.title, l2: n.body};
    }

    const e = exampleEvent(s, price, ratios);
    if (!e) return {dim: false, l1: `${tk(s, coins[1])}/${coins[0]} ↑ —`, l2: 'Отношение достигло уровня'};
    const n = renderNotification(e);
    return {dim: false, l1: n.title, l2: n.body};
}

function tk(s: NewSignalState, t: string): string {
    return s.market === 'perp' ? t + PERP_SUFFIX : t;
}

export function summaryLines(s: NewSignalState): string[] {
    const kind = kindOf(s);
    const a = tk(s, s.slots[0]);
    const lines: string[] = [];

    if (kind === 'price') {
        lines.push(`Цена ${a}: ${cleanNum(parseTarget(s.target))} USDT`);
    } else if (kind === 'pct') {
        lines.push(`${a}: ${pctText(s.pct, s.abs)} за ${s.pctPeriod}${s.abs ? ', рост или падение' : ''}`);
    } else {
        const st = strategy(s);
        const p = stratPeriod(s);
        const coins = activeSlots(s);
        lines.push(st.ru);
        if (st.id === 'ratio') {
            lines.push(coins.map(t => tk(s, t)).join(' · '));
            coins.slice(1).forEach((t, i) => lines.push(`Уровень ${t}/${coins[0]}: ${ratioNum(parseTarget(s.levels[i]))}`));
        } else {
            lines.push(`${coins.map(t => tk(s, t)).join(' · ')}, ${st.id === 'fund' ? 'порог ' + p : p}`);
        }
    }

    const cap = repeatCaption(s);
    lines.push(s.repeat[kind] ? `Повтор: ${cap.charAt(0).toLowerCase()}${cap.slice(1)}` : 'Повтор выключен');
    return lines;
}

const NBSP = ' ';

export function rubNum(v: number): string {
    return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function rub(v: number): string {
    return rubNum(v) + NBSP + '₽';
}

export interface PlanRow {
    id: PlanId;
    name: string;
    sub: string;
    price: string;
}

export function planRows(prices: Plan[]): PlanRow[] {
    const base = prices.find(p => p.id === '1m');
    if (!base) return [];
    return prices.map(p => ({
        id: p.id,
        name: PLAN_NAMES[p.id],
        sub: p.months > 1 ? `${rub(planPerMonth(p))} в месяц · ${MINUS}${planDiscount(p, base)}%` : 'Без скидки',
        price: rub(p.rub),
    }));
}

export function proBenefits(market: Market, signals: number): string[] {
    return [
        `До ${signals} активных сигналов`,
        'Все стратегии: объём, ложный пробой, VWAP, RSI, OI, фандинг, ликвидации',
        `Связки из 2–3 ${market === 'perp' ? 'фьючерсов' : 'спотов'}`,
        '«Цена %» за любой период от 5m',
    ];
}

export function proReason(err: {code?: string; message?: string} | null | undefined, config: SignalConfig, pro: boolean): string | null {
    if (err?.code === 'PRO_REQUIRED') return err.message || needPro(config, {pro: false, active: 0});
    if (err?.code === 'LIMIT' && !pro) return needPro(config, {pro: false, active: FREE.signals});
    return null;
}

