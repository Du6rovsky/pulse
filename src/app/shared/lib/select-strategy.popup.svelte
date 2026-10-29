<script lang="ts">
    import {FREE, strategyBadge, type Mode, type Strategy, type StrategyId} from "@shared";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import Popup from "./popup-tmpl.component.svelte";
    import RadioButton from "./radio-button.svelte";
    import StrategyDetail from "./strategy-detail.svelte";
    import ProBadge from "./pro-badge.svelte";
    import {tick} from "svelte";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        strategies?: Strategy[];
        selected?: StrategyId;
        mode?: Mode;
        subtitle?: string;
        periodOf?: (s: Strategy) => string;
        pro?: boolean;
        onchange?: (id: StrategyId) => void;
    }

    let {
        pup = $bindable(null),
        strategies = [],
        selected,
        mode = 1,
        subtitle = '',
        periodOf = () => '',
        pro = false,
        onchange = () => {},
    }: Props = $props();

    let pend = $state<StrategyId>(null);
    let group: HTMLElement = $state(null);

    async function show() {
        pend = selected;
        await tick();
        group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    }

    function submit() {
        if (pend && pend !== selected) onchange(pend);
        pup?.toClose();
    }

    function arrows(e: KeyboardEvent, idx: number) {
        const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;

        e.preventDefault();
        const i = (idx + d + strategies.length) % strategies.length;
        pend = strategies[i].id;
        tick().then(() => {
            const row = group?.querySelectorAll<HTMLElement>('[role="radio"]')[i];
            row?.focus();
            row?.scrollIntoView({block: 'nearest'});
        });
    }
</script>

<Popup bind:this={pup} is_swipe_content={false} onshow={show} title={$_('STRATEGY')} subtitle={subtitle}>
    {#snippet content()}
        <div class="flex flex-col gap-2 px-1 pb-2">
            <div bind:this={group}
                 class="w-full max-h-[60vh] overflow-y-auto flex flex-col gap-1"
                 role="radiogroup"
                 aria-label={$_('STRATEGY')}>
                {#each strategies as s, idx (s.id)}
                    <div class="flex flex-col gap-2 rounded-md {s.id === pend ? 'bg-fort-200 pb-2' : ''}">
                        <button type="button"
                                role="radio"
                                aria-checked={s.id === pend}
                                tabindex={s.id === pend ? 0 : -1}
                                class="w-full p-2 text-left rounded-md overflow-hidden ripple-container rpl-white"
                                use:addRippleEffect
                                onclick={() => pend = s.id}
                                onkeydown={(e) => arrows(e, idx)}>
                            <RadioButton item={{id: s.id, value: s.en}} selectedId={pend} sub={s.ru}>
                                {#snippet right()}
                                    {#if pro || FREE.strategies.includes(s.id)}
                                        <span class="num shrink-0 ml-2 px-1 rounded-sm border border-fort-300 text-xs-2 text-fort-400 font-light">
                                            {strategyBadge(s)}
                                        </span>
                                    {:else}
                                        <span class="shrink-0 ml-1"><ProBadge/></span>
                                    {/if}
                                {/snippet}
                            </RadioButton>
                        </button>
                        {#if s.id === pend}
                            <div class="px-2 pl-9">
                                <StrategyDetail strategy={s} mode={mode} period={periodOf(s)}/>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                    onclick={submit}>
                {$_('CHOOSE')}
            </button>
        </div>
    {/snippet}
</Popup>
