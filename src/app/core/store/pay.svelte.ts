import type {FiscalReceipt, PayCreateData, PlanId} from "@shared";

export type PaySheet = 'sbp' | 'active' | 'receipt' | null;

export type ReceiptFrom = 'active' | 'access';

export const pay = $state({
    sheet: null as PaySheet,
    key: '',
    plan: '1m' as PlanId,
    invoice: null as PayCreateData | null,
    busy: false,
    error: '',
    paidId: '',
    receipt: null as FiscalReceipt | null,
    receiptFor: '',
    receiptFrom: 'active' as ReceiptFrom,
    receipts: [] as FiscalReceipt[],
    receiptAt: 0,
    refunds: null as FiscalReceipt[] | null,
});
