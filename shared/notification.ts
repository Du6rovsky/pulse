import {PERP_SUFFIX, type Market} from './markets.js';
import type {Period} from './periods.js';

export const MINUS = '−';

export type Dir = 'up' | 'down';

interface Base {
    market: Market;
    coins: string[];
}

export type NotifyEvent = Base & (
    | {type: 'price'; dir: Dir; target: string}
    | {type: 'pct'; period: Period; change: number; priceFrom: string; priceTo: string}
    | {type: 'brk'; dir: Dir; level: string; volRatio?: number}
    | {type: 'fake'; dir: Dir; level: string; elapsedMin: number}
    | {type: 'vol'; period: Period; volRatio: number; change: number}
    | {type: 'vwap'; dir: Dir; price: string; vwap: string}
    | {type: 'oi'; period: Period; oiChange: number; change: number}
    | {type: 'fund'; rate: number; payInMin: number}
    | {type: 'liq'; period: Period; side: 'long' | 'short'; sum: number; usual: number; change: number}
    | {type: 'rsi'; period: Period; rsi: number; price: string}
    | {type: 'rs'; period: Period; follower: string; stronger: boolean; changes: number[]}
    | {type: 'ratio'; follower: string; dir: 'above' | 'below'; level: number}
    | {type: 'dec'; period: Period; follower: string; rho: number; rhoUsual: number}
);

export interface Notification {
    title: string;
    body: string;
}

export function cutNum(x: number, digits = 3): string {
    const abs = Math.abs(x);
    let s = String(abs);
    if (s.includes('e')) s = abs < 1 ? '0' : abs.toFixed(0);
    const [int, frac = ''] = s.split('.');
    const f = frac.slice(0, digits).replace(/0+$/, '');
    const out = f ? `${int}.${f}` : int;
    return x < 0 && out !== '0' ? MINUS + out : out;
}

export function signedNum(x: number): string {
    const s = cutNum(x);
    return s.startsWith(MINUS) ? s : '+' + s;
}

export function usd(x: number): string {
    if (x >= 1e6) return `$${cutNum(x / 1e6, 1)}M`;
    if (x >= 1e3) return `$${Math.trunc(x / 1e3)}K`;
    return `$${Math.trunc(x)}`;
}

export function ratioNum(x: number): string {
    const abs = Math.abs(x);
    if (abs === 0 || !Number.isFinite(x)) return '0';
    if (abs >= 1e5) return (x < 0 ? MINUS : '') + abs.toFixed(0);
    const r = Number(abs.toPrecision(5));
    const digits = Math.max(0, 4 - Math.floor(Math.log10(r)));
    const s = digits ? r.toFixed(digits).replace(/\.?0+$/, '') : r.toFixed(0);
    return (x < 0 ? MINUS : '') + s;
}

export function rsiNum(x: number): string {
    const s = x.toFixed(1);
    return s === '70.0' || s === '30.0' ? x.toFixed(2) : s;
}

const arrow = (up: boolean): string => up ? '↑' : '↓';

export function renderNotification(e: NotifyEvent): Notification {
    const tk = (t: string): string => e.market === 'perp' ? t + PERP_SUFFIX : t;
    const [L] = e.coins;
    const T = tk(L);
    const n = (title: string, body: string): Notification => ({title, body});

    switch (e.type) {
        case 'price':
            return n(`${T} ${arrow(e.dir === 'up')} ${e.target}`, 'Цена достигла цели');
        case 'pct':
            return n(`${T} ${arrow(e.change > 0)} ${signedNum(e.change)}% за ${e.period}`, `${e.priceFrom} → ${e.priceTo}`);
        case 'brk': {
            const vol = e.volRatio === undefined ? '' : ` · объём за 1h ×${cutNum(e.volRatio)}`;
            return e.dir === 'up'
                ? n(`${T} ↑ Пробой max 24h`, `Цена > ${e.level}${vol}`)
                : n(`${T} ↓ Пробой min 24h`, `Цена < ${e.level}${vol}`);
        }
        case 'fake': {
            const el = e.elapsedMin % 60 ? `${e.elapsedMin}m` : `${e.elapsedMin / 60}h`;
            return e.dir === 'down'
                ? n(`${T} ↓ Ложный пробой max 24h`, `Цена < ${e.level} через ${el}`)
                : n(`${T} ↑ Ложный пробой min 24h`, `Цена > ${e.level} через ${el}`);
        }
        case 'vol':
            return n(`${T} Объём ×${cutNum(e.volRatio)} за ${e.period}`,
                `Цена ${arrow(e.change > 0)} ${signedNum(e.change)}% за ${e.period}`);
        case 'vwap':
            return e.dir === 'up'
                ? n(`${T} ↑ Пересечение VWAP 24h`, `Цена ${e.price} > VWAP ${e.vwap}`)
                : n(`${T} ↓ Пересечение VWAP 24h`, `Цена ${e.price} < VWAP ${e.vwap}`);
        case 'oi':
            return n(`${T} OI ${signedNum(e.oiChange)}% за ${e.period}`, `Цена ${signedNum(e.change)}% за ${e.period}`);
        case 'fund': {
            const payer = e.rate > 0 ? 'длинные' : 'короткие';
            const h = Math.floor(e.payInMin / 60);
            const pay = h ? `${h}h ${e.payInMin % 60}m` : `${e.payInMin}m`;
            return n(`${T} фандинг ${signedNum(e.rate)}%`, `Платят ${payer} позиции · выплата через ${pay}`);
        }
        case 'liq': {
            const side = e.side === 'long' ? 'длинных' : 'коротких';
            return n(`${T} ликвидации ${side} позиций ${usd(e.sum)} за ${e.period}`,
                `Обычно до ${usd(e.usual)} · цена ${signedNum(e.change)}%`);
        }
        case 'rsi':
            return n(`${T} RSI ${rsiNum(e.rsi)} · ${e.period}`, `${e.rsi > 50 ? 'Выше 70' : 'Ниже 30'} · цена ${e.price}`);
        case 'ratio':
            return n(`${tk(e.follower)}/${L} ${arrow(e.dir === 'above')} ${ratioNum(e.level)}`, 'Отношение достигло уровня');
        case 'rs': {
            const ch = (c: string): string => `${c} ${signedNum(e.changes[e.coins.indexOf(c)])}%`;
            const others = e.coins.slice(1).filter(c => c !== e.follower);
            const parts = [ch(e.follower), ch(L), ...others.map(ch)];
            return n(`${tk(e.follower)} ${e.stronger ? 'сильнее' : 'слабее'} ${L} за ${e.period}`, parts.join(' · '));
        }
        case 'dec':
            return n(`${tk(e.follower)} ≠ ${L}: отвязка`,
                `Корреляция за ${e.period}: ${cutNum(e.rho)}, обычно ${cutNum(e.rhoUsual)}`);
    }
}
