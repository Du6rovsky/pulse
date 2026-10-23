import {needPro as needProFor, type SignalConfig} from "@shared";
import {
    activeSlots, canCreate, defaults, isTargetError, preview, ratiosOf, repeatCaption, summaryLines, toConfig, type NewSignalState, type Preview,
} from "../utils/new-signal.util";
import {me} from "./me.svelte";
import {activeCount} from "./signals.svelte";

export const newSignal: NewSignalState = $state(defaults());

const price = $state({value: '', ratios: [] as number[]});

export function setPrices(prices: (string | undefined)[]): void {
    price.value = prices[0] ?? '';
    price.ratios = ratiosOf(prices);
}

export function resetNewSignal(): void {
    const {market, mode} = newSignal;
    Object.assign(newSignal, defaults(), {market, mode});
}

export const newSignalView = {
    get activeSlots(): string[] { return activeSlots(newSignal); },
    get config(): SignalConfig { return toConfig(newSignal, price.ratios, price.value); },
    get needPro(): string | null { return needProFor(toConfig(newSignal), {pro: me.pro, active: activeCount()}); },
    get canCreate(): boolean { return canCreate(newSignal, price.ratios); },
    get preview(): Preview { return preview(newSignal, price.value, price.ratios); },
    get repeatCaption(): string { return repeatCaption(newSignal); },
    get summaryLines(): string[] { return summaryLines(newSignal); },
    get targetError(): boolean { return isTargetError(newSignal.target); },
};
