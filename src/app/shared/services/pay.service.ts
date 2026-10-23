import {
    TERMS_V, type DisableQuoteData, type ErrData, type FiscalReceipt, type MeData, type PayCreateData, type PayUpdateData, type PlanId,
    type RefundsData,
} from "@shared";
import {
    addPending, dropPending, payAction, readDraft, readPending, readRefund, writeDraft, writeReceipt, writeRefund, writeRefundReceipts,
} from "../../core/utils/pay.util";
import {pay, type ReceiptFrom} from "../../core/store/pay.svelte";
import {access} from "../../core/store/access.svelte";
import {pro, setMe} from "../../core/store/me.svelte";
import {newSignal} from "../../core/store/new-signal.svelte";
import {changeHash} from "../../core/utils/toolbox.util";
import {ePages} from "../../core/entities/pages.enum";
import {request} from "../../core/utils/ws.util";
import {getKey} from "./license.service";

let activating = false;

async function invoice(): Promise<PayCreateData> {
    const d = await request<PayCreateData>('pay.create', {key: pay.key, plan: pay.plan, terms: TERMS_V});
    pay.invoice = d;
    addPending({paymentId: d.paymentId, plan: pay.plan});
    return d;
}

async function startPay(key: string, plan: PlanId): Promise<boolean> {
    if (pay.busy) return false;
    pay.key = key;
    pay.plan = plan;
    pay.busy = true;
    pay.error = '';
    try {
        await invoice();
        if (pro.pendingCreate) writeDraft(newSignal);
        pay.sheet = 'sbp';
        return true;
    } catch (e) {
        pay.error = (e as Partial<ErrData>)?.message ?? '';
        return false;
    } finally {
        pay.busy = false;
    }
}

function openPayUrl(url: string): void {
    const w = window.open(url, '_blank');
    if (w) w.opener = null;
    else location.href = url;
}

async function payNow(): Promise<void> {
    let d = pay.invoice;
    if (!d || pay.busy) return;
    if (d.expiresAt <= Date.now()) {
        pay.busy = true;
        try {
            d = await invoice();
        } catch {
            return;
        } finally {
            pay.busy = false;
        }
    }
    openPayUrl(d.payUrl);
}

function keepReceipt(d: PayUpdateData): void {
    if (!d.receipt || d.paymentId !== pay.paidId) return;
    pay.receipt = d.receipt;
    pay.receiptFor = d.paymentId;
    writeReceipt(d.receipt);
}

function forget(paymentId: string): void {
    dropPending(paymentId);
    if (!readPending().length) writeDraft(null);
}

async function onPayUpdate(d: PayUpdateData): Promise<void> {
    keepReceipt(d);

    const pending = readPending().find(p => p.paymentId === d.paymentId);
    if (!pending) return;

    const action = payAction(d.status);
    if (action === 'drop') forget(d.paymentId);
    if (action !== 'activate' || activating) return;

    const key = getKey();
    if (!key) return;

    activating = true;
    try {
        setMe(await request<MeData>('lic.activate', {key}));
        forget(d.paymentId);
        pay.paidId = d.paymentId;
        pay.plan = d.plan ?? pending.plan;
        pay.receipt = null;
        keepReceipt(d);
        pay.sheet = 'active';
    } catch {
    } finally {
        activating = false;
    }
}

async function checkPay(): Promise<void> {
    const ids = [...readPending().map(p => p.paymentId),pay.paidId && pay.receiptFor !== pay.paidId ? pay.paidId : ''];
    for (const paymentId of new Set(ids.filter(Boolean))) {
        try {
            await onPayUpdate(await request<PayUpdateData>('pay.status', {paymentId}));
        } catch {
        }
    }
}

function closeSheet(): void {
    const resume = pay.sheet === 'active' || pay.sheet === 'receipt';
    pay.sheet = null;
    if (!resume) return;
    writeDraft(null);
    pro.resumed++;
}

function openReceipt(from: ReceiptFrom, list: FiscalReceipt[] = []): void {
    pay.receiptFrom = from;
    pay.receipts = list;
    pay.receiptAt = 0;
    pay.sheet = 'receipt';
}

function nextReceipt(): void {
    if (pay.receipts.length < 2) return;
    pay.receiptAt = (pay.receiptAt + 1) % pay.receipts.length;
}

async function disableQuote(): Promise<void> {
    access.refundRub = (await request<DisableQuoteData>('lic.disableQuote', {})).amountRub;
}

async function openDisable(): Promise<void> {
    if (access.busy) return;
    access.busy = true;
    access.error = '';
    try {
        await disableQuote();
        access.sheet = 'disable';
    } catch {
    } finally {
        access.busy = false;
    }
}

async function disablePro(): Promise<void> {
    if (access.busy) return;
    access.busy = true;
    access.error = '';
    try {
        const d = await request<DisableQuoteData>('lic.disable', {amountRub: access.refundRub});
        if (d.amountRub > 0) writeRefund(true);
        if (access.sheet === 'disable') access.sheet = 'access';
    } catch (e) {
        const err = e as Partial<ErrData>;
        access.error = err?.message ?? '';
        if (err?.code === 'REFUND_CHANGED') await disableQuote().catch(() => {});
    } finally {
        access.busy = false;
    }
}

async function checkRefunds(): Promise<void> {
    if (!readRefund()) return;
    try {
        onRefunds(await request<RefundsData>('pay.refunds', {}));
    } catch {
    }
}

function onRefunds(d: RefundsData): void {
    if (d.status === 'pending') return;
    if (d.status === 'done') {
        writeRefundReceipts(d.receipts);
        pay.refunds = d.receipts;
    }
    writeRefund(false);
}

function payBack(): void {
    if (pay.sheet === 'sbp') {
        pay.sheet = null;
        access.back = true;
        access.sheet = 'key';
    } else if (pay.sheet === 'receipt') {
        if (pay.receiptFrom === 'access') {
            pay.sheet = null;
            access.sheet = 'access';
        } else {
            pay.sheet = 'active';
        }
    }
}

function restoreDraft(): void {
    const d = readDraft();
    if (!d) return;
    Object.assign(newSignal, d);
    pro.restored = true;
    if (readPending().length) pro.pendingCreate = true;
    else writeDraft(null);
    changeHash(ePages.SIGNALS);
}

function stripPayParam(): string | null {
    const url = new URL(location.href);
    const payId = url.searchParams.get('pay');
    if (payId === null) return null;
    url.searchParams.delete('pay');
    history.replaceState(history.state, '', url);
    return payId;
}

export {
    startPay,
    payNow,
    onPayUpdate,
    checkPay,
    closeSheet,
    openReceipt,
    nextReceipt,
    openDisable,
    disablePro,
    checkRefunds,
    onRefunds,
    payBack,
    restoreDraft,
    stripPayParam,
}
