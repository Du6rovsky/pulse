<svelte:options/>

<script lang="ts">
    import {getLabel, getPercent24, getPercentStyle, sortingArray} from "../../core/utils/toolbox.util";
    import type {Ticker} from "../../core/utils/new-signal.util";
    import {rates$} from "../../core/store/exchange.store";
    import {ePages} from "../../core/entities/pages.enum";
    import Popup from "./popup-tmpl.component.svelte";
    import {icons} from "../../assets/icons/icons";
    import {onMount} from "svelte";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        tokens?: Ticker[];
        title?: string;
        used?: string[];
        selected?: string;
        dim?: boolean;
        onchange?: (pair: {name: string, rate: number, percent: string}) => void;
        onstart?: (rate: number) => void;
    }

    let {
        pup = $bindable(null),
        tokens,
        title = '',
        used = [],
        selected = '',
        dim = false,
        onchange = () => {},
        onstart = () => {},
    }: Props = $props();

    let page = $state<ePages>();
    let ratesObj = $state({});
    let search = $state('');
    let rates = $state<Ticker[]>([]);
    let searchInput: HTMLInputElement = $state(null);

    let cells = $derived.by(() => {
        const list = tokens ? [...tokens] : rates;
        if (tokens) sortingArray(list, 'symbol', 'asc');
        const query = search.trim().toLowerCase();
        return list.filter(item => getLabel(item.symbol).toLowerCase().includes(query));
    });

    const bestTokens = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'GRAMUSDT'];
    const closeIcn = icons().close;
    const subSymbol = 'USDT';

    onMount(() => {
        rates$.subscribe((value) => {
            if (Object.keys(ratesObj).length === 0 && Object.keys(value).length > 0 ) {
                ratesObj = value;
                onstart(JSON.parse(ratesObj['ETHUSDT'])?.lastPrice);

                rates = Object.keys(ratesObj)?.map((key: any) => JSON.parse(ratesObj[key]));

                sortingArray(rates, 'symbol', 'asc');
            }
        })
    })

    function init() {
        search = '';

        if (window.matchMedia?.('(hover:hover) and (pointer:fine)').matches) {
            const t = setTimeout(() => {
                searchInput?.focus();
                clearTimeout(t);
            });
        }
    }

    function selectPair(pair: any) {
        onchange({
            name: getLabel(pair?.symbol),
            rate: pair?.lastPrice,
            percent: pair?.price24hPcnt
        })
        pup?.toClose();
    }
</script>

<Popup bind:this={pup} is_swipe_content={false} onshow={init} {title}>
    {#snippet content()}
        <div class="h-[calc(80vh)] flex flex-col gap-5 overflow-y-auto no-scrollbar px-0.5">
            <div class="flex flex-row gap-2 justify-between items-center px-2 mt-1">
                <input class="w-full appearance-none border-b-2 border-zinc-700 rounded-md py-1 px-2 text-white
                             leading-tight bg-fort-300 focus:outline-none focus:border-sky-300 font-sans font-light
                             text-left text-sm"
                       id="search_"
                       type="text"
                       autocomplete="off"
                       placeholder={$_('SEARCH')}
                       bind:this={searchInput}
                       bind:value={search}>

                {#if !title}
                    <button class="flex items-center justify-center border border-fort-300 rounded-md w-7 text-white
                            fill-white p-0.5"
                            onclick={pup?.toClose}>
                        <i class="h-5 w-5">
                            {@html closeIcn}
                        </i>
                    </button>
                {/if}
            </div>
            <div class="w-full grid grid-cols-3 grid-rows-3 gap-2 px-1">
                {#each cells as r (r.symbol)}
                    {@const name = getLabel(r.symbol)}
                    {@const isUsed = used.includes(name)}
                    <button type="button"
                            class="w-full overflow-hidden relative rounded-md border border-fort-300
                                   px-1 py-2 text-sm flex flex-row justify-between items-center
                                   {name === selected ? 'bg-fort-300' : 'bg-fort-100'}
                                   {isUsed ? 'opacity-50' : ''}"
                            aria-pressed={name === selected}
                            disabled={isUsed}
                            onclick={() => selectPair(r)}>
                        <span class="flex flex-col items-start justify-center">
                            <span class="leading-3 font-light
                                            {bestTokens.includes(r.symbol) ? 'text-cyan-200' : 'text-white'}">
                                {name}
                            </span>

                            <span class="text-slate-400 leading-3 font-light text-xs-3">
                               {subSymbol}
                            </span>
                        </span>

                        <span class="flex flex-col {dim ? 'opacity-50' : ''}">
                            <span class="text-white text-end font-light leading-3">
                                {r.lastPrice}
                            </span>
                            {#if tokens}
                                <span class="num self-end px-1 rounded-md font-light text-xs-3 leading-3
                                             {getPercentStyle(r.price24hPcnt)}">
                                    {getPercent24(r.price24hPcnt)}
                                </span>
                            {:else}
                                <span class=""></span>
                            {/if}
                        </span>
                    </button>
                {:else}
                    <span class="col-span-3 py-6 text-center text-sm font-light text-fort-400">{$_('TOKEN_NOT_IN_TOP')}</span>
                {/each}
            </div>
        </div>
    {/snippet}
</Popup>
