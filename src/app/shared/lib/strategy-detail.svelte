<script lang="ts">
    import {strategyText, type Mode, type Strategy} from "@shared";
    import {_} from "svelte-i18n";

    type Props = {
        strategy: Strategy;
        mode: Mode;
        period: string;
    }

    let {strategy, mode, period}: Props = $props();

    let blocks = $derived([
        {title: 'WHAT_TRACKS', text: strategyText(strategy.what, mode)},
        {title: 'ADVANTAGE', text: strategyText(strategy.adv, mode)},
    ]);
</script>

<div class="flex flex-col gap-2">
    {#each blocks as b (b.title)}
        <div class="flex flex-col gap-0.5">
            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 uppercase">{$_(b.title)}</span>
            <span class="text-sm leading-sm font-light text-white">{b.text.replaceAll('{period}', period)}</span>
        </div>
    {/each}
</div>
