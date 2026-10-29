import type {Mode} from './markets.js';
import type {Period} from './periods.js';
import type {StrategyId} from './strategies.js';

export const FREE: {
    readonly signals: number;
    readonly strategies: readonly StrategyId[];
    readonly pctPeriods: readonly Period[];
    readonly modes: readonly Mode[];
} = {signals: 1, strategies: ['brk'], pctPeriods: ['24h'], modes: [1]};

export const PRO = {signals: 25} as const;

export const RATES_S = {free: 30, pro: 2} as const;

export type PlanId = '1m' | '3m' | '6m' | '12m';

export const PLAN_IDS: readonly PlanId[] = ['1m', '3m', '6m', '12m'];

export const PLAN_NAMES: Record<PlanId, string> = {'1m': '1 месяц', '3m': '3 месяца', '6m': '6 месяцев', '12m': '12 месяцев'};

export interface Plan {
    id: PlanId;
    months: number;
    rub: number;
}

export const PLANS: Plan[] = [
    {id: '1m', months: 1, rub: 2290},
    {id: '3m', months: 3, rub: 6390},
    {id: '6m', months: 6, rub: 11890},
    {id: '12m', months: 12, rub: 21990},
];

export const TERMS_V = '2026-10-27';

export function planDiscount(plan: Plan, base: Plan): number {
    return Math.round((1 - plan.rub / (base.rub * plan.months)) * 100);
}

export function planPerMonth(plan: Plan): number {
    return plan.rub / plan.months;
}
