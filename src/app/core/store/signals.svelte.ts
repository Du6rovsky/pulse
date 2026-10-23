import type {SigHitData, SignalRecord} from "@shared";
import {request} from "../utils/ws.util";
import {cache} from "../utils/cache.util";

export const signals = $state({list: [] as SignalRecord[]});

export function activeCount(): number {
    return signals.list.filter(r => !r.paused).length;
}

export async function loadSignals(): Promise<boolean> {
    try {
        signals.list = await request<SignalRecord[]>('sig.list');
    } catch {
        return false;
    }
    cache.saveSignals(signals.list);
    return true;
}

export function syncTariff(wasPro: boolean, pro: boolean): void {
    if (wasPro && !pro) void loadSignals();
}

export function addSignal(rec: SignalRecord): void {
    signals.list = [rec, ...signals.list.filter(r => r.id !== rec.id)];
    cache.saveSignals(signals.list);
}

export async function removeSignal(id: string): Promise<boolean> {
    try {
        await request<{id: string}>('sig.delete', {id});
    } catch {
        return false;
    }
    signals.list = signals.list.filter(r => r.id !== id);
    cache.saveSignals(signals.list);
    return true;
}

export function applyHit(d: SigHitData): void {
    const rec = signals.list.find(r => r.id === d.id);
    if (!rec) return;
    rec.hits = d.hits;
    rec.lastHitAt = d.lastHitAt;
    cache.saveSignals(signals.list);
}
