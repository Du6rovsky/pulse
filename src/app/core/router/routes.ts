import {ePages} from "../entities/pages.enum";

const defaultPage = ePages.EXCHANGE;
const routes = {
    [ePages.CONVERTER]: import("../../views/converter/converter.view.svelte"),
    [ePages.EXCHANGE]: import("../../views/exchange/exchange.view.svelte"),
    [ePages.SIGNALS]: import("../../views/signals/signals.view.svelte"),
};

export {
    defaultPage,
    routes,
}