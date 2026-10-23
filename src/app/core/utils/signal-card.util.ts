import {fundLabel, ratioNum, strategyById, type SignalRecord} from "@shared";
import {cleanNum, pctText} from "./new-signal.util";

export function cardTickers(r: SignalRecord): string {
    return r.coins.join(' · ');
}

export function cardTitle(r: SignalRecord): string {
    if (r.kind === 'price') return 'Цена';
    if (r.kind === 'pct') return 'Цена %';
    return strategyById(r.stratId)?.en ?? '';
}

export function cardSub(r: SignalRecord): string {
    if (r.kind === 'price') {
        const v = cleanNum(r.target ?? 0);
        return r.dir ? `${r.dir === 'up' ? '↑' : '↓'} ${v}` : v;
    }
    if (r.kind === 'pct') return `${pctText(r.pct ?? 0, r.abs ?? false)} за ${r.period}`;

    const st = strategyById(r.stratId);
    if (!st) return '';
    let param: string;
    if (st.id === 'fund') param = `порог ${fundLabel(r.threshold ?? 0)}`;
    else if (st.id === 'ratio') param = (r.levels ?? []).map((l, i) => `${r.coins[i + 1]}/${r.coins[0]} ${ratioNum(l.level)}`).join(', ');
    else param = r.period ?? st.fixed ?? '';
    return `${st.ru} · ${param}`;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function fmtDate(ms: number): string {
    const d = new Date(ms);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function fmtTime(ms: number): string {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateTime(ms: number): string {
    return `${fmtDate(ms)} ${fmtTime(ms)}`;
}
