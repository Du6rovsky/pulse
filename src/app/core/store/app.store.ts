import {type Writable, writable} from "svelte/store";

const toHideHeaderContent$: Writable<boolean> = writable(false);
const isShowNav$: Writable<boolean> = writable(true);
const clipboard$: Writable<string> = writable(null);
const deviceId$: Writable<string> = writable(null);
const insets$: Writable<any> = writable(null);
const prevPage$: Writable<string> = writable();
const locale$: Writable<string> = writable();
const page$: Writable<string> = writable();

export {
    toHideHeaderContent$,
    isShowNav$,
    clipboard$,
    prevPage$,
    deviceId$,
    insets$,
    locale$,
    page$,
}