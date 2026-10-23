import type {FiscalReceipt, PayStatus, PlanId} from "@shared";
import type {NewSignalState} from "./new-signal.util";

export const PENDING_KEY = 'pay.pending';
export const RECEIPT_KEY = 'pay.lastReceipt';
export const DRAFT_KEY = 'pay.draft';
export const REFUND_KEY = 'pay.refund';
export const REFUND_RECEIPTS_KEY = 'pay.refundReceipts';

const MSK_OFFSET = 3 * 3600_000;

export interface PendingPay {
    paymentId: string;
    plan: PlanId;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function payAction(status: PayStatus): 'activate' | 'drop' | 'none' {
    if (status === 'paid') return 'activate';
    if (status === 'expired' || status === 'canceled') return 'drop';
    return 'none';
}

export function money(v: number): string {
    return v.toFixed(2).replace('.', ',');
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dateLong(ms: number): string {
    const d = new Date(ms);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function receiptDate(at: number): string {
    const d = new Date(at * 1000 + MSK_OFFSET);
    return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${String(d.getUTCFullYear()).slice(2)} `
        + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const SNO_NAMES: Record<string, string> = {
    usn_income: 'УСН доход',
    usn_income_outcome: 'УСН доход минус расход',
    osn: 'ОСН',
    patent: 'ПСН',
};

export function snoName(code: string): string {
    return SNO_NAMES[code] ?? code;
}

function read<T>(store: Store, key: string): T | null {
    try {
        const v = store.getItem(key);
        return v ? JSON.parse(v) as T : null;
    } catch {
        return null;
    }
}

function write(store: Store, key: string, v: unknown | null): void {
    try {
        if (v === null) store.removeItem(key);
        else store.setItem(key, JSON.stringify(v));
    } catch {
    }
}

export function readPending(store: Store = localStorage): PendingPay[] {
    const v = read<unknown>(store, PENDING_KEY);
    const list = Array.isArray(v) ? v : [v];
    return list.filter((p): p is PendingPay => typeof (p as Partial<PendingPay> | null)?.paymentId === 'string');
}

function writePending(list: PendingPay[], store: Store): void {
    write(store, PENDING_KEY, list.length ? list : null);
}

export function addPending(p: PendingPay, store: Store = localStorage): void {
    const list = readPending(store);
    if (list.some(x => x.paymentId === p.paymentId)) return;
    writePending([...list, p], store);
}

export function dropPending(paymentId: string, store: Store = localStorage): void {
    writePending(readPending(store).filter(x => x.paymentId !== paymentId), store);
}

export function readReceipt(store: Store = localStorage): FiscalReceipt | null {
    return read<FiscalReceipt>(store, RECEIPT_KEY);
}

export function writeReceipt(r: FiscalReceipt, store: Store = localStorage): void {
    write(store, RECEIPT_KEY, r);
}

export function readRefund(store: Store = localStorage): boolean {
    return read<unknown>(store, REFUND_KEY) === true;
}

export function writeRefund(on: boolean, store: Store = localStorage): void {
    write(store, REFUND_KEY, on || null);
}

export function readRefundReceipts(store: Store = localStorage): FiscalReceipt[] {
    const v = read<unknown>(store, REFUND_RECEIPTS_KEY);
    return Array.isArray(v) ? v as FiscalReceipt[] : [];
}

export function writeRefundReceipts(list: FiscalReceipt[], store: Store = localStorage): void {
    write(store, REFUND_RECEIPTS_KEY, list.length ? list : null);
}

export function readDraft(store: Store = localStorage): NewSignalState | null {
    const d = read<NewSignalState>(store, DRAFT_KEY);
    return d && Array.isArray(d.slots) ? d : null;
}

export function writeDraft(d: NewSignalState | null, store: Store = localStorage): void {
    write(store, DRAFT_KEY, d);
}
