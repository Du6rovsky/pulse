<script lang="ts">
    import {FUND_MAX, FUND_MIN, FUND_STEP, fundLabel} from "@shared";
    import {clampFund, stepFund} from "../../core/utils/new-signal.util";
    import Popup from "./popup-tmpl.component.svelte";
    import Slider from "./slider.svelte";
    import {tick} from "svelte";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        value?: number;
        title?: string;
        subtitle?: string;
        onchange?: (value: number) => void;
    }

    let {
        pup = $bindable(null),
        value = FUND_MIN,
        title = '',
        subtitle = '',
        onchange = () => {},
    }: Props = $props();

    let pend = $state(FUND_MIN);
    let box: HTMLElement = $state(null);
    let label = $derived(fundLabel(pend));

    async function show() {
        pend = value;
        await tick();
        box?.querySelector<HTMLElement>('input[type="range"]')?.focus();
    }

    function submit() {
        if (pend !== value) onchange(pend);
        pup?.toClose();
    }
</script>

<Popup bind:this={pup} onshow={show} title={title} subtitle={subtitle}>
    {#snippet content()}
        <div bind:this={box} class="flex flex-col gap-3 px-1 pb-2">
            <div class="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
                <button type="button"
                        class="num w-11 h-11 rounded-lg border border-fort-300 text-white text-xl disabled:opacity-35"
                        aria-label={$_('STEP_DEC')}
                        disabled={pend <= FUND_MIN}
                        onclick={() => pend = stepFund(pend, -1)}>
                    −
                </button>
                <span class="num text-center text-3xl leading-3xl font-bold text-green-300">{label}</span>
                <button type="button"
                        class="num w-11 h-11 rounded-lg border border-fort-300 text-white text-xl disabled:opacity-35"
                        aria-label={$_('STEP_INC')}
                        disabled={pend >= FUND_MAX}
                        onclick={() => pend = stepFund(pend, 1)}>
                    +
                </button>
            </div>

            <div class="flex flex-col gap-2">
                <Slider min={FUND_MIN}
                        max={FUND_MAX}
                        step={FUND_STEP}
                        value={pend}
                        isShowValue={false}
                        labels={[`±${FUND_MIN}%`, `±${FUND_MAX}%`]}
                        ariaLabel={title}
                        ariaValuetext={label}
                        onchange={(v) => pend = clampFund(v)}/>
            </div>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                    onclick={submit}>
                {$_('CHOOSE')}
            </button>
        </div>
    {/snippet}
</Popup>
