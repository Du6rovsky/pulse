import type {ConnState} from "./connection.util";
import {fmtDateTime, fmtTime} from "./signal-card.util";

export type Tone = 'red' | 'yellow';

export interface Txt {
    key: string;
    values?: Record<string, string>;
}

const NO_TIME = '—';

const dt = (at: number | null): string => at === null ? NO_TIME : fmtDateTime(at);
const hm = (at: number | null): string => at === null ? NO_TIME : fmtTime(at);

const LINE: Record<ConnState, {key: string; tone: Tone | null} | null> = {
    ok: null,
    connecting: {key: 'CONN_LINE_CONNECTING', tone: null},
    offline: {key: 'CONN_LINE_OFFLINE', tone: 'red'},
    server: {key: 'CONN_LINE_SERVER', tone: 'red'},
    stale: {key: 'CONN_LINE_STALE', tone: 'yellow'},
    sync: {key: 'CONN_LINE_SYNC', tone: null},
};

export function statusLine(s: ConnState): {key: string; tone: Tone | null} | null {
    return LINE[s];
}

export function isDim(s: ConnState): boolean {
    return s === 'offline' || s === 'server' || s === 'stale';
}

export function connNotice(s: ConnState, at: number | null): {tone: Tone; title: string; text: Txt} | null {
    const values = {at: dt(at)};
    if (s === 'offline') return {tone: 'red', title: 'CONN_OFFLINE', text: {key: 'CONN_OFFLINE_TEXT', values}};
    if (s === 'server') return {tone: 'red', title: 'CONN_SERVER_DOWN', text: {key: 'CONN_SERVER_TEXT', values}};
    if (s === 'stale') return {tone: 'yellow', title: 'CONN_STALE', text: {key: 'CONN_STALE_TEXT', values}};
    return null;
}

export interface ConnRow {
    label: string;
    value: Txt;
    tone?: Tone;
}

export function connSheet(s: ConnState, at: number | null, pro: boolean): {sub: string; rows: ConnRow[]} {
    const rates: ConnRow = {label: 'CONN_RATES', value: {key: pro ? 'CONN_RATES_PRO' : 'CONN_RATES_FREE'}};
    const net = (v: string, tone?: Tone): ConnRow => ({label: 'CONN_INTERNET', value: {key: v}, tone});
    const srv = (v: string, tone?: Tone): ConnRow => ({label: 'CONN_SERVER', value: {key: v}, tone});
    const exch = (v: Txt, tone?: Tone): ConnRow => ({label: 'CONN_EXCHANGE', value: v, tone});
    const sig = (v: string, tone?: Tone): ConnRow => ({label: 'CONN_SIGNALS', value: {key: v}, tone});

    switch (s) {
        case 'connecting':
            return {sub: 'CONN_RECONNECTING', rows: [
                net('CONN_YES'), srv('CONN_RECONNECTING', 'yellow'),
                exch({key: 'CONN_FROM', values: {at: hm(at)}}), sig('CONN_CHECKED_ON_SERVER'),
            ]};
        case 'offline':
            return {sub: 'CONN_OFFLINE', rows: [
                net('CONN_NO', 'red'), srv('CONN_NO_LINK'),
                exch({key: 'CONN_FROM', values: {at: dt(at)}}), sig('CONN_CHECKED_ON_SERVER'),
            ]};
        case 'server':
            return {sub: 'CONN_SERVER_DOWN', rows: [
                net('CONN_YES'), srv('CONN_UNAVAILABLE', 'red'),
                exch({key: 'CONN_FROM', values: {at: dt(at)}}), sig('CONN_NO_DATA', 'yellow'),
            ]};
        case 'stale':
            return {sub: 'CONN_STALE', rows: [
                net('CONN_YES'), srv('CONN_CONNECTED'),
                exch({key: 'CONN_NOT_UPDATING_SINCE', values: {at: hm(at)}}, 'yellow'), rates, sig('CONN_NOT_CHECKED', 'yellow'),
            ]};
        default:
            return {sub: 'CONN_ALL_OK', rows: [
                net('CONN_YES'), srv('CONN_CONNECTED'),
                exch({key: 'CONN_UPDATING'}), rates, sig('CONN_CHECKED'),
            ]};
    }
}
