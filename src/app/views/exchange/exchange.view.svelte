<script lang="ts">
    import {getLabel, getPercent24, getPercentStyle, getTurnOver, sortingArray} from "../../core/utils/toolbox.util";
    import Filter from "../../shared/lib/filter-triangles.component.svelte";
    import MainTmpl from "../../shared/lib/main-tmpl.svelte";
    import {rates$} from "../../core/store/exchange.store";
    import {connection} from "../../core/store/connection.svelte";
    import {isDim} from "../../core/utils/connection-ui.util";
    import ConnectionNotice from "../../shared/lib/connection-notice.svelte";
    import {_} from "../../core/utils/i18";
    import {onMount} from "svelte";

    const eSort = {
        PAIRS: 'symbol',
        VALUE: 'turnover24h',
        PRICE: 'lastPrice',
        CHANGE: 'price24hPcnt',
    }
    const bestTokens = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'GRAMUSDT'];

    let rates = $state([]);
    let sort = $state({
        prop: eSort.VALUE,
        direction: 'desc',
    });

    const subSymbol = ' / USDT'

    let dim = $derived(isDim(connection.state));

    onMount(() => {
        rates$.subscribe((data: Object) => {
            if (data) {
                rates = Object.keys(data)?.map((key: any) => JSON.parse(data[key]));

                sortingArray(rates, sort?.prop, sort?.direction);
            }
        })
    })

    function checkSort(value: string) {
        return value !== sort?.prop ? 0 : (sort?.direction === 'asc' ? 1 : -1);
    }

    function changeSort(value: string) {
        if (sort?.prop !== value) {
            sort.prop = value;
            sort.direction = 'desc';
        } else {
            if (sort.direction === 'desc') {
                sort.direction = 'asc';
            } else {
                sort.prop = eSort.VALUE;
                sort.direction = 'desc';
            }
        }

        sortingArray(rates, sort?.prop, sort?.direction);
    }
</script>

<MainTmpl isShowHeader={false} isOverflowScroll={true}>
    {#snippet content()}
        <div class="w-full flex flex-col pb-12">
            <ConnectionNotice classes="py-1"/>
            <div class="w-full flex flex-row justify-between text-slate-400 font-light text-xs-3 py-0.5">
                <div class="flex flex-row justify-start items-center gap-2">
                    <button class="flex flex-row justify-start items-center gap-0.5
                                   {checkSort(eSort.PAIRS) !== 0 ? 'text-cyan-200' : ''}"
                            onclick={() => changeSort(eSort.PAIRS)}>
                        {$_('TRADE_PAIRS')}
                        <Filter direction={checkSort(eSort.PAIRS)}/>
                    </button>

                    <button class="flex flex-row justify-start items-center gap-0.5
                                   {checkSort(eSort.VALUE) !== 0 ? 'text-cyan-200' : ''}"
                            onclick={() => changeSort(eSort.VALUE)}>
                        {$_('VALUE_24')}
                        <Filter direction={checkSort(eSort.VALUE)}/>
                    </button>
                </div>

                <div class="flex flex-row justify-end items-center gap-2">
                    <button class="flex flex-row justify-end items-center gap-0.5
                                   {checkSort(eSort.PRICE) !== 0 ? 'text-cyan-200' : ''}"
                            onclick={() => changeSort(eSort.PRICE)}>
                        {$_('PRICE')}
                        <Filter direction={checkSort(eSort.PRICE)}/>
                    </button>

                    <button class="flex flex-row justify-end items-center gap-0.5 text-xs h-full
                                   {checkSort(eSort.CHANGE) !== 0 ? 'text-cyan-200' : ''}"
                            onclick={() => changeSort(eSort.CHANGE)}>
                        {$_('CHANGE_24')}
                        <Filter direction={checkSort(eSort.CHANGE)}/>
                    </button>
                </div>
            </div>
            <div class="flex flex-col gap-1">
                {#each rates as r}
                    <div class="flex flex-row justify-between items-center px-1 py-0.5 text-sm
                            bg-fort-100 overflow-hidden relative rounded-md border border-fort-300">
                        <div class="flex flex-col justify-center items-start">
                            <p>
                                <span class="leading-3 font-light
                                            {bestTokens?.includes(r?.symbol) ? 'text-cyan-200' : 'text-white'}">
                                    {getLabel(r?.symbol)}
                                </span>

                                <span class="text-slate-400 leading-3 font-light text-xs-3">
                                    {subSymbol}
                                </span>
                            </p>

                            <span class="text-fort-400 leading-3 font-light text-xs-3">
                                {getTurnOver(r?.turnover24h)}
                            </span>
                        </div>

                        <div class="flex flex-row gap-2 {dim ? 'opacity-50' : ''}">
                            <div class="flex flex-col justify-center">
                                <span class="num text-white text-end font-light text-xs-3">
                                    {r?.lastPrice}
                                </span>
                            </div>

                            <div class="flex flex-col justify-center">
                                <span class="num py-1 rounded-md w-14 text-center font-light text-xs-3
                                    {getPercentStyle(r?.price24hPcnt)}">
                                    {getPercent24(r?.price24hPcnt)}
                                </span>
                            </div>
                        </div>
                    </div>
                {:else}
                    {#each {length: 21}}
                        <div class="h-9 rounded-md bg-fort-300 animate-pulse"></div>
                    {/each}
                {/each}
            </div>
        </div>
    {/snippet}
</MainTmpl>
