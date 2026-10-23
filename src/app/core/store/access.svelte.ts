import type {Market, PlanId} from "@shared";
import {pro} from "./me.svelte";

export type AccessSheet = 'pro' | 'key' | 'access' | 'restore' | 'restored' | 'revoked' | 'disable' | null;

export const access = $state({
    sheet: null as AccessSheet,
    reason: '',
    market: 'spot' as Market,
    busy: false,
    error: '',
    refundRub: 0,
    key: '',
    plan: '1m' as PlanId,
    revoked: 0,
    restoreFrom: null as AccessSheet,
    back: false,
});

export function openPro(reason = '', market: Market = 'spot'): void {
    access.reason = reason;
    access.market = market;
    access.error = '';
    access.sheet = 'pro';
}

export function openAccess(): void {
    pro.pendingCreate = false;
    access.sheet = 'access';
}

export function openRestore(): void {
    access.restoreFrom = access.sheet;
    access.sheet = 'restore';
}

export function accessBack(): void {
    if (access.sheet === 'key') {
        access.back = true;
        access.sheet = 'pro';
    } else if (access.sheet === 'restore') {
        access.sheet = access.restoreFrom;
    } else if (access.sheet === 'disable') {
        access.sheet = 'access';
    }
}

export function closeAccess(s: AccessSheet): void {
    if (access.sheet === s) access.sheet = null;
}
