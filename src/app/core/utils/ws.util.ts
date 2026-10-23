import type {ErrData, MeData, PayUpdateData, RatesData, RefundsData, SigHitData, WsMsg} from "@shared";
import {checkPay, checkRefunds, onPayUpdate, onRefunds} from "../../shared/services/pay.service";
import {me, setMe} from "../store/me.svelte";
import {syncPush} from "../../shared/services/pwa.service";
import {onRevoked} from "../../shared/services/license.service";
import {applyHit, loadSignals, signals, syncTariff} from "../store/signals.svelte";
import {showToast} from "../store/toasts.svelte";
import {setConnection} from "../store/connection.svelte";
import {WsService} from "../../shared/services/ws.service";
import {getToken, SERVER_ORIGIN} from "../../shared/services/api.service";
import {perpRates$, rates$} from "../store/exchange.store";
import {cache, cachedAt, fromRates} from "./cache.util";
import {createConnection} from "./connection.util";
import {fromRows} from "./new-signal.util";
import {get, writable} from "svelte/store";

const wsStore$ = writable<WsService | null>(null);
const ws$= writable<WsService | null>(null);
const wsErr$ = writable<ErrData | null>(null);

async function getUrl(): Promise<string> {
    const res = await getToken();
    const {token} = await res.json();

    const base = SERVER_ORIGIN.replace(/^http/, "ws");
    return `${base}/ws?token=${encodeURIComponent(token)}`;
}

function getWebSocket() {
    wsStore$.update((current) => {
        if (current) return current;

        signals.list = cache.data.signals;
        rates$.set(fromRows(fromRates(cache.data.rates.spot)));
        perpRates$.set(fromRows(fromRates(cache.data.rates.perp)));

        const conn = createConnection({online: navigator.onLine, ratesAt: cachedAt(cache.data), onChange: setConnection});

        const ws = new WsService(getUrl);

        ws.on("status", (status) => {
            console.log("🛰 WS status:", status);
            if (status === "open") {
                conn.open();
                void loadSignals().then(ok => ok && conn.gotList());
                void checkPay();
            }
            if (status === "failed") conn.failed();
            if (status === "closed") conn.closed();
        });

        ws.on("message", (msg: WsMsg) => {
            if (msg?.t === "rates" && msg.d) {
                const d = msg.d as RatesData;
                rates$.set(fromRows(d.spot));
                perpRates$.set(fromRows(d.perp));
                cache.saveRates(d, Date.now());
            }
            if (msg?.t === "me" && msg.d) {
                const d = msg.d as MeData;
                const wasPro = me.pro;
                setMe(d);
                syncTariff(wasPro, d.pro);
                void syncPush();
                void checkRefunds();
            }
            if (msg?.t === "sig.hit" && msg.d) {
                const d = msg.d as SigHitData;
                applyHit(d);
                showToast(d.title, d.body);
            }
            if (msg?.t === "pay.update" && msg.d) {
                void onPayUpdate(msg.d as PayUpdateData);
            }
            if (msg?.t === "pay.refunds" && msg.d) {
                onRefunds(msg.d as RefundsData);
            }
            if (msg?.t === "lic.revoked") {
                onRevoked();
            }
            if (msg?.t === "err") {
                wsErr$.set(msg.d as ErrData);
            }
            if (msg?.t) conn.msg(msg.t, msg.d);
        });

        window.addEventListener("online", () => {
            conn.online();
            ws.kick();
        });
        window.addEventListener("offline", () => {
            conn.offline();
            ws.drop();
        });
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") ws.kick();
        });

        ws$.set(ws);
        return ws;
    })
}

function request<T = unknown>(t: string, d?: unknown): Promise<T> {
    const ws = get(ws$);
    if (!ws) return Promise.reject<T>({code: 'OFFLINE', message: ''} satisfies ErrData);
    return ws.request<T>(t, d);
}

export {
    getWebSocket,
    request,
    wsStore$,
    wsErr$,
    ws$
}
