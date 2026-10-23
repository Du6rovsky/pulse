import type {StData} from "@shared";

export type ConnState = 'ok' | 'stale' | 'connecting' | 'offline' | 'server' | 'sync';

export interface ConnView {
    state: ConnState;
    dataAt: number | null;
}

export const HIDE_DROP_MS = 1500;
export const SYNC_MIN_MS = 1000;

const SYNC_NEED = ['me', 'st', 'sig.list', 'rates'] as const;

export function canReach(state: ConnState): boolean {
    return state === 'ok' || state === 'stale';
}

export function createConnection(opts: {online: boolean; ratesAt: number | null; onChange: (v: ConnView) => void}) {
    let state: ConnState = opts.online ? 'connecting' : 'offline';
    let online = opts.online;
    let wsOpen = false;
    let fails = 0;
    let exchange: StData['exchange'] | null = null;
    let staleSince: number | null = null;
    let ratesAt = opts.ratesAt;
    let sync: {need: Set<string>; since: number; timer: ReturnType<typeof setTimeout>} | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    function emit() {
        opts.onChange({state, dataAt: state === 'stale' && staleSince !== null ? staleSince : ratesAt});
    }

    function set(s: ConnState) {
        state = s;
        emit();
    }

    function stopHide() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = null;
    }

    function stopSync() {
        if (sync) clearTimeout(sync.timer);
        sync = null;
    }

    function byExchange(): ConnState {
        return exchange === 'stale' ? 'stale' : 'ok';
    }

    function connecting() {
        if (state === 'ok') {
            hideTimer ??= setTimeout(() => {
                hideTimer = null;
                set('connecting');
            }, HIDE_DROP_MS);
            return;
        }
        set('connecting');
    }

    function finishSync() {
        if (!sync || sync.need.size || Date.now() - sync.since < SYNC_MIN_MS) return;
        stopSync();
        set(byExchange());
    }

    function got(t: string) {
        if (!sync) return;
        sync.need.delete(t);
        finishSync();
    }

    emit();

    return {
        open() {
            wsOpen = true;
            fails = 0;
            exchange = null;
            stopSync();
            if (state === 'ok') {
                stopHide();
                return;
            }
            sync = {need: new Set(SYNC_NEED), since: Date.now(), timer: setTimeout(finishSync, SYNC_MIN_MS)};
            set('sync');
        },
        failed() {
            wsOpen = false;
            if (!online) return;
            fails++;
            if (fails >= 2) {
                stopHide();
                set('server');
                return;
            }
            connecting();
        },
        closed() {
            wsOpen = false;
            stopSync();
            if (!online) return;
            fails = 0;
            connecting();
        },
        online() {
            online = true;
            fails = 0;
            if (!wsOpen) set('connecting');
        },
        offline() {
            online = false;
            wsOpen = false;
            stopHide();
            stopSync();
            set('offline');
        },
        msg(t: string, d?: unknown) {
            if (t === 'rates') {
                ratesAt = Date.now();
            }
            if (t === 'st' && d) {
                const st = d as StData;
                exchange = st.exchange;
                staleSince = st.staleSince != null ? Date.now() - (st.now - st.staleSince) : null;
                if (wsOpen && !sync && !hideTimer) {
                    set(byExchange());
                }
            }
            got(t);
            if (t === 'rates') emit();
        },
        gotList() {
            got('sig.list');
        },
    };
}

export type Connection = ReturnType<typeof createConnection>;
