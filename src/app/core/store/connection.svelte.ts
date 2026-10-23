import {canReach, type ConnState, type ConnView} from "../utils/connection.util";

export const connection: ConnView = $state({state: 'connecting', dataAt: null});

export const connUi = $state({sheet: false});

let live: ConnView = {state: 'connecting', dataAt: null};
let dev: ConnState | null = null;

function apply(): void {
    Object.assign(connection, dev ? {...live, state: dev} : live);
}

export function setConnection(v: ConnView): void {
    live = v;
    apply();
}

export function devConnection(s: ConnState | null): void {
    dev = s;
    apply();
}

export function openConnSheet(): void {
    connUi.sheet = true;
}

export function canReachServer(): boolean {
    return canReach(connection.state);
}
