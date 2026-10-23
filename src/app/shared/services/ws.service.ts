import type {ErrData, WsMsg} from "@shared";
import {generateUUID} from "../../core/utils/toolbox.util";

type WSStatus = "connecting" | "open" | "closed" | "failed";

type Pending = {
    resolve: (d: unknown) => void;
    reject: (e: ErrData) => void;
    timer: ReturnType<typeof setTimeout>;
};

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];
const REQUEST_TIMEOUT = 15000;
const PULSE_TIMEOUT = 25000;
const CONNECT_TIMEOUT = 15000;

export class WsService {
    private getUrl: () => Promise<string>;
    private isOnline: () => boolean;
    private ws: WebSocket | null = null;
    private opened = false;
    private busy = false;
    private attempt = 0;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private pulseTimer: ReturnType<typeof setTimeout> | null = null;
    private isManualClose = false;
    private pending = new Map<string, Pending>();

    private listeners: Record<string, ((data: any) => void)[]> = {};

    constructor(getUrl: () => Promise<string>, isOnline: () => boolean = () => navigator.onLine) {
        this.getUrl = getUrl;
        this.isOnline = isOnline;
        if (this.isOnline()) this.connect();
    }

    private async connect() {
        const n = ++this.attempt;
        this.busy = true;
        this.setStatus("connecting");
        setTimeout(() => this.abandon(n), CONNECT_TIMEOUT);

        let url: string;
        try {
            url = await this.getUrl();
        } catch {
            if (n !== this.attempt) return;
            this.busy = false;
            this.setStatus("failed");
            this.reconnect();
            return;
        }

        if (this.isManualClose || n !== this.attempt) return;

        const ws = new WebSocket(url);
        this.ws = ws;
        this.opened = false;

        ws.onopen = () => {
            this.opened = true;
            this.busy = false;
            this.reconnectAttempts = 0;
            this.beat();
            this.setStatus("open");

            console.info("✅ WebSocket connected");
        };

        ws.onmessage = (event) => {
            this.beat();

            let data: any;
            try {
                data = JSON.parse(event.data);
            } catch {
                this.emit("message", event.data);
                return;
            }

            if (data?.id && this.pending.has(data.id)) {
                this.settle(data);
                return;
            }

            this.emit("message", data);
        };

        ws.onerror = (err) => {
            console.warn("⚠️ WebSocket error:", err);
        };

        ws.onclose = () => this.onClosed(ws);
    }

    private onClosed(ws: WebSocket) {
        if (this.ws !== ws) return;
        this.ws = null;
        this.busy = false;
        if (this.pulseTimer) clearTimeout(this.pulseTimer);
        this.pulseTimer = null;

        this.setStatus(this.opened ? "closed" : "failed");
        console.warn("🔌 WebSocket closed");

        this.pending.forEach((p, id) => this.fail(id, {code: "CLOSED", message: ""}));

        if (!this.isManualClose) {
            this.reconnect();
        }
    }

    private abandon(n: number) {
        if (n !== this.attempt || !this.busy || this.isManualClose) return;
        if (this.ws) {
            this.drop();
            return;
        }
        this.attempt++;
        this.busy = false;
        this.setStatus("failed");
        this.reconnect();
    }

    private beat() {
        if (this.pulseTimer) clearTimeout(this.pulseTimer);
        this.pulseTimer = setTimeout(() => {
            console.warn("💔 WebSocket silent, reconnecting");
            this.drop();
        }, PULSE_TIMEOUT);
    }

    private reconnect() {
        if (!this.isOnline()) return;

        const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)];
        this.reconnectAttempts++;

        console.info(`⏳ Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    kick() {
        if (this.isManualClose || this.ws || this.busy || !this.isOnline()) return;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        this.connect();
    }

    drop() {
        const ws = this.ws;
        if (!ws) return;
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
        this.onClosed(ws);
    }

    private settle(msg: WsMsg & {id: string}) {
        const p = this.pending.get(msg.id);
        if (!p) return;
        if (msg.t === "err") {
            this.fail(msg.id, msg.d as ErrData);
            return;
        }
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        p.resolve(msg.d);
    }

    private fail(id: string, e: ErrData) {
        const p = this.pending.get(id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(id);
        p.reject(e);
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = typeof data === "string" ? data : JSON.stringify(data);
            this.ws.send(message);
        } else {
            console.warn("❌ WebSocket not ready, message dropped");
        }
    }

    request<T = unknown>(t: string, d?: unknown): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject<T>({code: "OFFLINE", message: ""} satisfies ErrData);
        }

        const id = generateUUID();

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => this.fail(id, {code: "TIMEOUT", message: ""}), REQUEST_TIMEOUT);
            this.pending.set(id, {resolve: resolve as (d: unknown) => void, reject, timer});
            this.send({t, id, d} satisfies WsMsg);
        });
    }

    on(event: string, handler: (data: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }

    private emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((cb) => cb(data));
        }
    }

    private setStatus(status: WSStatus) {
        this.emit("status", status);
    }

    close() {
        this.isManualClose = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.pulseTimer) clearTimeout(this.pulseTimer);
        this.ws?.close();
    }
}
