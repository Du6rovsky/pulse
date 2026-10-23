<script lang="ts">
    import {planRows, proBenefits} from "../../core/utils/new-signal.util";
    import type {Market, MeData, PlanId} from "@shared";
    import Popup from "./popup-tmpl.component.svelte";
    import RadioButton from "./radio-button.svelte";
    import {canReachServer} from "../../core/store/connection.svelte";
    import {icons} from "../../assets/icons/icons";
    import {tick} from "svelte";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        me: MeData;
        market?: Market;
        reason?: string;
        busy?: boolean;
        error?: string;
        oncontinue?: (plan: PlanId) => void;
        onrestore?: () => void;
        onclose?: () => void;
    }

    let {
        pup = $bindable(null),
        me,
        market = 'spot',
        reason = '',
        busy = false,
        error = '',
        oncontinue = () => {},
        onrestore = () => {},
        onclose = () => {},
    }: Props = $props();

    const checkIcn = icons().check;

    let plan = $state<PlanId>('1m');
    let group: HTMLElement = $state(null);

    let rows = $derived(planRows(me.prices));
    let benefits = $derived(proBenefits(market, me.limits.pro.signals));
    let price = $derived(rows.find(r => r.id === plan)?.price ?? '');

    async function show(back: PlanId | null) {
        plan = back ?? '1m';
        await tick();
        group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    }

    function arrows(e: KeyboardEvent, idx: number) {
        const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;

        e.preventDefault();
        const i = (idx + d + rows.length) % rows.length;
        plan = rows[i].id;
        tick().then(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.focus());
    }
</script>

<Popup bind:this={pup} onshow={show} onclose={onclose} title="PRO" subtitle={reason}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <ul class="flex flex-col gap-1.5">
                {#each benefits as b}
                    <li class="flex flex-row items-start gap-2 text-sm-3 leading-sm-4 text-white font-light">
                        <span class="w-4 h-4 shrink-0 mt-0.5 text-cyan-200" aria-hidden="true">{@html checkIcn}</span>
                        <span>{b}</span>
                    </li>
                {/each}
            </ul>


            <div bind:this={group} class="flex flex-col gap-1" role="radiogroup" aria-label={$_('PRO_TERM')}>
                {#each rows as r, idx (r.id)}
                    <button type="button"
                            role="radio"
                            aria-checked={r.id === plan}
                            tabindex={r.id === plan ? 0 : -1}
                            class="w-full p-2 rounded-md text-left border border-fort-300 {r.id === plan ? 'bg-fort-200' : ''}"
                            onclick={() => plan = r.id}
                            onkeydown={(e) => arrows(e, idx)}>
                        <RadioButton item={{id: r.id, value: r.name}} selectedId={plan} sub={r.sub}>
                            {#snippet right()}
                                <span class="num shrink-0 ml-2 text-sm-3 leading-sm-4 text-white font-light">{r.price}</span>
                            {/snippet}
                        </RadioButton>
                    </button>
                {/each}
            </div>

            <span class="text-sm leading-sm text-fort-400 font-light">{$_('PRO_FINE')}</span>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 {canReachServer() ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                    disabled={!price || busy || !canReachServer()}
                    onclick={() => oncontinue(plan)}>
                {$_('CONTINUE')} · {price}
            </button>

            {#if error}
                <span class="text-sm leading-sm text-error-250 font-light" role="alert">{error}</span>
            {/if}

            {#if !me.pro}
                <button type="button"
                        class="w-full h-9 text-sm-3 text-cyan-200 font-light"
                        onclick={onrestore}>
                    {$_('HAVE_KEY')}
                </button>
            {/if}
        </div>
    {/snippet}
</Popup>
