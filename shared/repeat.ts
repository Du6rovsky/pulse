import type {SignalConfig} from './signal.js';
import {strategyById} from './strategies.js';

const AGAIN = 'Снова при каждом новом достижении';

export function repeatLabel(c: SignalConfig): string {
    if (!c.repeat) return 'Сработает один раз';
    if (c.kind === 'price') return AGAIN;
    if (c.kind === 'pct') return c.period === '24h' ? AGAIN : `Не чаще раза в ${c.period}`;
    const s = strategyById(c.stratId);
    return (s?.repeat ?? '').replace('{period}', c.period ?? s?.fixed ?? '');
}
