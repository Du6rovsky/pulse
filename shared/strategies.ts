import type {Market, Mode} from './markets.js';
import {P_CORR, P_FAKE, P_RS, W, type Period} from './periods.js';

export type StrategyGroup = 'single' | 'perpOnly' | 'multi';
export type StrategyId = 'brk' | 'fake' | 'vol' | 'vwap' | 'rsi' | 'oi' | 'fund' | 'liq' | 'rs' | 'ratio' | 'dec';

export const FUND_MIN = 0.01;
export const FUND_MAX = 1;
export const FUND_STEP = 0.01;
export const FUND_DEFAULT = 0.05;

export function fundLabel(x: number): string {
    return `±${x.toFixed(2)}%`;
}

export type StrategyText = string | readonly [string, string];

export interface Strategy {
    group: StrategyGroup;
    id: StrategyId;
    en: string;
    ru: string;
    periods: readonly Period[] | null;
    fixed: Period | null;
    paramLabel: string;
    hint: string | null;
    what: StrategyText;
    adv: StrategyText;
    repeat: string;
}

export const STRATEGIES: readonly Strategy[] = [
    {
        group: 'single', id: 'brk', en: '24h Breakout', ru: 'Пробой суточного диапазона',
        periods: null, fixed: '24h', paramLabel: 'Период', hint: null,
        what: 'Цена вышла за max или min последних 24 часов. В уведомлении — пробитый уровень и объём торгов за последний час относительно обычного.',
        adv: 'Вы узнаёте о выходе цены за суточный диапазон в момент пробоя, без наблюдения за графиком.',
        repeat: 'Снова после возврата в диапазон',
    },
    {
        group: 'single', id: 'fake', en: 'False Breakout', ru: 'Ложный пробой',
        periods: P_FAKE, fixed: null, paramLabel: 'Период', hint: 'Сколько ждать возврата в диапазон',
        what: 'Цена вышла за max или min последних 24 часов, но в течение выбранного периода вернулась в суточный диапазон.',
        adv: 'Вы узнаёте, что пробой не удержался, сразу после возврата цены.',
        repeat: 'Снова при следующем ложном пробое',
    },
    {
        group: 'single', id: 'vol', en: 'Volume Spike', ru: 'Всплеск объёма',
        periods: W, fixed: null, paramLabel: 'Период', hint: 'За какое время считать объём',
        what: 'Объём торгов токеном за выбранный период выше, чем в 98% таких же периодов за последнюю неделю.',
        adv: 'Вы узнаёте о резком росте торговой активности по итогам выбранного периода.',
        repeat: 'Не чаще раза в {period}',
    },
    {
        group: 'single', id: 'vwap', en: 'VWAP Cross', ru: 'Пересечение VWAP',
        periods: null, fixed: '24h', paramLabel: 'Период', hint: null,
        what: 'Цена пересекла VWAP — среднюю цену сделок за 24 часа, взвешенную по объёму.',
        adv: 'Вы узнаёте о переходе цены через среднюю цену суток без наблюдения за графиком.',
        repeat: 'Снова при следующем пересечении',
    },
    {
        group: 'single', id: 'rsi', en: 'RSI Overbought / Oversold', ru: 'RSI выше 70 или ниже 30',
        periods: W, fixed: null, paramLabel: 'Таймфрейм', hint: 'На каких свечах считать RSI',
        what: 'RSI 14 на свечах выбранного таймфрейма поднялся выше 70 или опустился ниже 30. Значение проверяется на закрытии свечи.',
        adv: 'Вы узнаёте о выходе RSI за границы 70 и 30 сразу после закрытия свечи, без наблюдения за графиком.',
        repeat: 'Снова после возврата RSI в диапазон 35–65',
    },
    {
        group: 'perpOnly', id: 'oi', en: 'Open Interest Spike', ru: 'Всплеск открытого интереса',
        periods: W, fixed: null, paramLabel: 'Период', hint: 'За какое время считать изменение',
        what: 'Открытый интерес — объём незакрытых позиций по фьючерсу. Сигнал срабатывает, если за выбранный период он изменился сильнее, чем в 98% таких же периодов за последнюю неделю.',
        adv: 'Вы узнаёте о резком изменении числа открытых позиций по итогам выбранного периода. В уведомлении — изменение открытого интереса и цены.',
        repeat: 'Не чаще раза в {period}',
    },
    {
        group: 'perpOnly', id: 'fund', en: 'Funding Extreme', ru: 'Экстремальный фандинг',
        periods: null, fixed: null, paramLabel: 'Порог', hint: 'При какой ставке за 8h присылать сигнал',
        what: 'Ставка финансирования вышла за выбранный порог в пересчёте на 8 часов. Обычный уровень — около 0.01%. Положительную ставку платят длинные позиции, отрицательную — короткие.',
        adv: 'Вы узнаёте о ставке за порогом за несколько минут до выплаты, когда она уже окончательная.',
        repeat: 'Снова после возврата ставки к обычному уровню',
    },
    {
        group: 'perpOnly', id: 'liq', en: 'Liquidation Spike', ru: 'Всплеск ликвидаций',
        periods: W, fixed: null, paramLabel: 'Период', hint: 'За какое время суммировать ликвидации',
        what: 'Сумма ликвидаций по токену за выбранный период больше, чем в 98% таких же периодов за последнюю неделю. В уведомлении — сторона ликвидированных позиций и сумма.',
        adv: 'Вы узнаёте о массовых принудительных закрытиях позиций по итогам выбранного периода.',
        repeat: 'Не чаще раза в {period}',
    },
    {
        group: 'multi', id: 'rs', en: 'Relative Strength', ru: 'Сила к лидеру',
        periods: P_RS, fixed: null, paramLabel: 'Период', hint: 'За какое время сравнивать изменение цены',
        what: [
            'За выбранный период ведомый изменился в цене заметно сильнее или слабее лидера: разница больше, чем в 98% таких же периодов для этой пары за последнюю неделю.',
            'За выбранный период один из ведомых изменился в цене заметно сильнее или слабее лидера: разница больше, чем в 98% таких же периодов для этой пары за последнюю неделю.',
        ],
        adv: 'Вы узнаёте об изменении относительной силы токенов сразу, без сравнения графиков.',
        repeat: 'Не чаще раза в {period}',
    },
    {
        group: 'multi', id: 'ratio', en: 'Ratio Cross', ru: 'Отношение пересекло уровень',
        periods: null, fixed: null, paramLabel: 'Уровень {B}/{A}', hint: null,
        what: [
            'Отношение цены ведомого к цене лидера достигло заданного уровня.',
            'Отношение цены одного из ведомых к цене лидера достигло заданного для него уровня.',
        ],
        adv: 'Вы узнаёте о достижении уровня отношения двух токенов сразу, без отдельного графика пары.',
        repeat: 'Снова при каждом новом достижении',
    },
    {
        group: 'multi', id: 'dec', en: 'Decoupling', ru: 'Отвязка от лидера',
        periods: P_CORR, fixed: null, paramLabel: 'Период', hint: 'За какое время считать корреляцию',
        what: [
            'Корреляция цены ведомого с ценой лидера за выбранный период опустилась ниже 0.5 при обычном для этой пары уровне выше 0.7.',
            'Корреляция цены одного из ведомых с ценой лидера за выбранный период опустилась ниже 0.5 при обычном для этой пары уровне выше 0.7.',
        ],
        adv: 'Вы узнаёте, что токен перестал двигаться вместе с лидером, сразу после нарушения связи.',
        repeat: 'Снова после возврата корреляции выше 0.7',
    },
];

export function strategyById(id: string | undefined): Strategy | undefined {
    return STRATEGIES.find(s => s.id === id);
}

export function strategiesFor(market: Market, mode: Mode): Strategy[] {
    if (mode !== 1) return STRATEGIES.filter(s => s.group === 'multi');
    return STRATEGIES.filter(s => s.group === 'single' || (s.group === 'perpOnly' && market === 'perp'));
}

export function strategyBadge(s: Strategy): string {
    if (s.id === 'fund') return `±${FUND_MIN}–${FUND_MAX}%`;
    if (s.id === 'ratio') return 'уровень';
    if (!s.periods) return s.fixed ?? '';
    return `${s.periods[0]}–${s.periods[s.periods.length - 1]}`;
}

export function strategyText(text: StrategyText, mode: Mode): string {
    return typeof text === 'string' ? text : text[mode === 3 ? 1 : 0];
}
