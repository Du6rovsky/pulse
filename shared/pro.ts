import type {SignalConfig} from './signal.js';
import {strategyById} from './strategies.js';
import {FREE} from './tariffs.js';

export interface ProContext {
    pro: boolean;
    active: number;
}

export function needPro(c: SignalConfig, ctx: ProContext): string | null {
    if (ctx.pro) return null;
    if (!FREE.modes.includes(c.mode)) {
        return `Связки из 2–3 ${c.market === 'perp' ? 'фьючерсов' : 'спотов'} — в PRO`;
    }
    if (c.kind === 'pct' && !(c.period && FREE.pctPeriods.includes(c.period))) {
        return `«Цена %» за ${c.period} — в PRO`;
    }
    if (c.kind === 'strat' && !(c.stratId && FREE.strategies.includes(c.stratId))) {
        return `${strategyById(c.stratId)?.en} — в PRO`;
    }
    if (ctx.active >= FREE.signals) return 'Бесплатно — 1 активный сигнал';
    return null;
}
