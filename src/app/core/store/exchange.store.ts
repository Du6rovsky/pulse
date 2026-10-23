import {type Writable, writable} from "svelte/store";

const rates$: Writable<Object> = writable({});
const perpRates$: Writable<Object> = writable({});
const btcPrice$: Writable<any> = writable({});

export {
    perpRates$,
    btcPrice$,
    rates$,
}
