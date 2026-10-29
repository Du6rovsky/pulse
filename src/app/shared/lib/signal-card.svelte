<script lang="ts">
    import {QUOTE_LABEL, type SignalRecord} from "@shared";
    import {cardSub, cardTickers, cardTitle, fmtDate, fmtDateTime} from "../../core/utils/signal-card.util";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {icons} from "../../assets/icons/icons";
    import {_} from "../../core/utils/i18";

    type Props = {
        rec: SignalRecord;
        onpaused?: () => void;
        ondelete?: () => void;
        canDelete?: boolean;
        dim?: boolean;
    }

    let {
        rec,
        onpaused = () => {},
        ondelete,
        canDelete = true,
        dim = false,
    }: Props = $props();

    const icn = icons();
</script>

<div class="relative">
    {#if rec.paused}
        <button type="button"
                aria-haspopup="dialog"
                class="w-full flex flex-col gap-1 p-2 rounded-lg bg-fort-100 border border-fort-300 text-left opacity-50
                       overflow-hidden ripple-container rpl-white"
                use:addRippleEffect
                onclick={onpaused}>
            {@render body()}
        </button>
    {:else}
        <article class="w-full flex flex-col gap-1 p-2 rounded-lg bg-fort-100 border border-fort-300">
            {@render body()}
        </article>
    {/if}

    {#if ondelete}
        <button type="button"
                class="absolute top-1.5 right-1.5 w-6 h-6 p-1 rounded-md text-fort-400 disabled:opacity-40 overflow-hidden rpl-white"
                aria-label={$_('DELETE_SIGNAL')}
                disabled={!canDelete}
                use:addRippleEffect
                onclick={ondelete}>
            {@html icn.trash}
        </button>
    {/if}
</div>

{#snippet body()}
    <div class="flex flex-row justify-between items-center gap-2 {ondelete ? 'pr-7' : ''}">
        <span class="min-w-0 truncate text-sm-3 leading-sm-4 text-white font-light">
            {cardTickers(rec)}
            <span class="text-slate-400 text-xs-3 leading-xs-3 font-light">{QUOTE_LABEL[rec.market]}</span>
        </span>

        <span class="num shrink-0 flex flex-row items-center gap-1 text-xs-3 leading-xs-3
                     {rec.hits > 0 ? 'text-cyan-200' : 'text-fort-400'} {dim ? 'opacity-50' : ''}"
              title={$_('HITS')}
              aria-label="{$_('HITS')}: {rec.hits}">
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M6 0L0.8 7H4.6L3.8 12L9.2 4.8H5.4Z" fill="currentColor"/></svg>
            <span>{rec.hits}</span>
        </span>
    </div>

    <div class="flex flex-col min-w-0">
        <span class="text-sm leading-sm text-white">{cardTitle(rec)}</span>
        <span class="text-xs-3 leading-xs-3 text-fort-400 font-light break-words">{cardSub(rec)}</span>
    </div>

    <div class="flex flex-row flex-wrap justify-between gap-x-3 text-xs-2 text-fort-400 font-light">
        <span>{$_('CREATED_AT')} {fmtDate(rec.createdAt)}</span>
        {#if rec.lastHitAt}
            <span class="text-cyan-200">{$_('FIRED_AT')} {fmtDateTime(rec.lastHitAt)}</span>
        {:else}
            <span>{$_('NOT_FIRED')}</span>
        {/if}
    </div>
{/snippet}
