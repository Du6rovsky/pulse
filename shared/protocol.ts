import type {LicErrCode} from './license.js';
import type {Market} from './markets.js';
import type {SignalConfig} from './signal.js';
import type {FREE, Plan, PlanId, PRO} from './tariffs.js';

export interface WsMsg<D = unknown> {
    t: string;
    id?: string;
    d?: D;
}

export type RateRow = [string, string, string];

export type RatesData = Record<Market, Record<string, RateRow>>;

export interface ErrData {
    code: string;
    message: string;
    retryIn?: number;
}

export type ErrCode = 'BAD_MSG' | 'UNKNOWN_CMD' | 'RATE_LIMIT' | 'NOT_IMPLEMENTED' | 'INTERNAL' | 'PRO_REQUIRED' | 'LIMIT' | LicErrCode
    | PayErrCode;

export type PayErrCode = 'PAY_UNAVAILABLE' | 'PAY_NOT_FOUND' | 'REFUND_CHANGED';

export const REFUND_MESSAGE = 'Сумма возврата изменилась. Проверьте её ещё раз.';

export interface PushSubData {
    endpoint: string;
    expirationTime?: number | null;
    keys: {p256dh: string; auth: string};
}

export interface PushPayload {
    v: 1;
    title: string;
    body: string;
    signalId: string;
    url: string;
}

export type ClientMsg =
    | {t: 'sig.list'; id?: string}
    | {t: 'sig.create'; id?: string; d: SignalConfig}
    | {t: 'sig.delete'; id?: string; d: {id: string}}
    | {t: 'push.sub'; id?: string; d: PushSubData}
    | {t: 'lic.issue'; id?: string; d: {plan: PlanId}}
    | {t: 'lic.activate'; id?: string; d: {key: string}}
    | {t: 'pay.create'; id?: string; d: {key: string; plan: PlanId; terms: string}}
    | {t: 'pay.status'; id?: string; d: {paymentId: string}}
    | {t: 'lic.disableQuote'; id?: string; d: Record<string, never>}
    | {t: 'lic.disable'; id?: string; d: {amountRub: number}}
    | {t: 'pay.refunds'; id?: string; d: Record<string, never>};

export type ClientCmd = ClientMsg['t'];

export interface MeData {
    pro: boolean;
    paidUntil: number | null;
    plan: PlanId | null;
    limits: {free: typeof FREE; pro: typeof PRO};
    prices: Plan[];
    payMethods: string[];
    vapidPublic: string;
}

export interface StData {
    now: number;
    engine: boolean;
    exchange: 'ok' | 'stale';
    staleSince?: number;
}

export interface SigHitData {
    id: string;
    hits: number;
    lastHitAt: number;
    title: string;
    body: string;
}

export interface PayCreateData {
    paymentId: string;
    amountRub: number;
    purpose: string;
    payUrl: string;
    qrPayload: string;
    expiresAt: number;
}

export type PayStatus = 'pending' | 'paid' | 'expired' | 'canceled' | 'refunded';

export interface PayUpdateData {
    paymentId: string;
    status: PayStatus;
    paidUntil?: number;
    plan?: PlanId;
    receipt?: FiscalReceipt;
}

export interface DisableQuoteData {
    amountRub: number;
}

export interface RefundsData {
    status: 'none' | 'pending' | 'done';
    receipts: FiscalReceipt[];
}

export type FiscalKind = 'income' | 'income_return';

export interface FiscalReceipt {
    kind: FiscalKind;
    sellerName: string;
    sellerInn: string;
    place: string;
    sno: string;
    item: string;
    qty: 1;
    price: number;
    sum: number;
    subject: 'service';
    method: 'full_payment';
    vat: 'none';
    cashless: number;
    kktRn: string;
    fn: string;
    fd: string;
    fp: string;
    at: number;
    ofdUrl?: string;
    qr: string;
}
