<script lang="ts">
    import {addRippleEffect, getLabel, getPercent24, getPercentStyle} from "../../core/utils/toolbox.util";
    import {newSignal, newSignalView, resetNewSignal, setPrices} from "../../core/store/new-signal.svelte";
    import {
        applyAbs, applyMarket, applyMode, applyStratParam, applyStrategy, defaultTarget, ensureLevels, fixSlots, isTargetError,
        kindOf, levelLabel, normalizeTarget, parseRates, pctAgoText, pctText, periodOf, proReason, strategy, stratPeriod, type Preview, type Ticker,
    } from "../../core/utils/new-signal.util";
    import {
        FREE, MARKETS, MINUS, MODES, MODE_LABELS, P_PCT, QUOTE_LABEL, ROLE_LABELS, strategiesFor, type ErrData, type Market, type Mode,
        type Period, type SignalKind, type SignalRecord, type Strategy,
    } from "@shared";
    import {me, pro} from "../../core/store/me.svelte";
    import {addSignal} from "../../core/store/signals.svelte";
    import {openPro as openProSheet} from "../../core/store/access.svelte";
    import SelectStrategy from "../../shared/lib/select-strategy.popup.svelte";
    import FundThreshold from "../../shared/lib/fund-threshold.popup.svelte";
    import StrategyDetail from "../../shared/lib/strategy-detail.svelte";
    import {perpRates$, rates$} from "../../core/store/exchange.store";
    import SelectToken from "../../shared/lib/select-token.popup.svelte";
    import ListSelector from "../../shared/lib/list-selector.svelte";
    import Checkbox from "../../shared/lib/checkbox.svelte";
    import Slider from "../../shared/lib/slider.svelte";
    import Popup from "../../shared/lib/popup-tmpl.component.svelte";
    import ProBadge from "../../shared/lib/pro-badge.svelte";
    import MainTmpl from "../../shared/lib/main-tmpl.svelte";
    import ConnectionNotice from "../../shared/lib/connection-notice.svelte";
    import {canReachServer, connection} from "../../core/store/connection.svelte";
    import {isDim, statusLine} from "../../core/utils/connection-ui.util";
    import {request} from "../../core/utils/ws.util";
    import {askPush, needInstallHint, setInstallHintShown} from "../../shared/services/pwa.service";
    import InstallPopup from "../../shared/lib/install.popup.svelte";
    import Toggle from "../../shared/lib/toggle.svelte";
    import {icons} from "../../assets/icons/icons";
    import {_} from "../../core/utils/i18";
    import {onDestroy, untrack} from "svelte";

    type Props = {
        onclose?: () => void;
    }

    let {
        onclose = () => {},
    }: Props = $props();

    const TABS: {id: SignalKind, label: string}[] = [
        {id: 'price', label: 'PRICE'},
        {id: 'pct', label: 'PRICE_PCT'},
        {id: 'strat', label: 'STRATEGIES'},
    ];
    const MARKET_LABELS: Record<Market, string> = {spot: 'SPOT', perp: 'PERP'};
    const NAV_HEIGHT = 44;
    const NAV_LINE_HEIGHT = 21;
    const PCT_PERIODS = P_PCT.map(p => ({id: p, value: p}));
    const icn = icons();

    let spotTokens: Ticker[] = $state([]);
    let perpTokens: Ticker[] = $state([]);
    let tokens = $derived(newSignal.market === 'perp' ? perpTokens : spotTokens);
    let symbols = $derived(tokens.map(t => getLabel(t.symbol)));
    let bySymbol = $derived(new Map(tokens.map(t => [getLabel(t.symbol), t])));
    let roles = $derived(ROLE_LABELS[newSignal.mode]);
    let kind = $derived(kindOf(newSignal));
    let hasLine = $derived(statusLine(connection.state) !== null);
    let canCreate = $derived(newSignalView.canCreate && canReachServer());
    let dim = $derived(isDim(connection.state));

    let pctLabel = $derived(pctText(newSignal.pct, newSignal.abs));

    let strategies = $derived(strategiesFor(newSignal.market, newSignal.mode));
    let strat = $derived(strategy(newSignal));
    let stratP = $derived(stratPeriod(newSignal));
    let isPctPeriod = $derived(kind === 'pct');
    let periodLists = $derived(isPctPeriod ? PCT_PERIODS : (strat.periods ?? []).map(p => ({id: p, value: p})));

    let selectTokenModal = $state(null);
    let selectStrategyModal = $state(null);
    let periodModal = $state(null);
    let fundModal = $state(null);
    let targetInit = untrack(() => pro.restored);
    pro.restored = false;
    let doneModal = $state<Popup>(null);
    let installModal = $state<Popup>(null);
    let slotIdx = $state(0);
    let busy = $state(false);
    let done = $state<{lines: string[], preview: Preview}>({lines: [], preview: null});

    const unsubs = [
        rates$.subscribe(v => spotTokens = parseRates(v as Record<string, string>)),
        perpRates$.subscribe(v => perpTokens = parseRates(v as Record<string, string>)),
    ];

    onDestroy(() => {
        unsubs.forEach(u => u());
    })

    $effect(() => {
        if (symbols.length === 0) return;
        const fixed = fixSlots(newSignal.slots, newSignal.mode, symbols);
        if (fixed.join() !== newSignal.slots.join()) newSignal.slots = fixed;
    });

    $effect(() => {
        setPrices(newSignalView.activeSlots.map(t => bySymbol.get(t)?.lastPrice));
    });

    $effect(() => {
        const t = newSignal.slots[0];
        const price = bySymbol.get(t)?.lastPrice;
        if (!price || (targetInit && newSignal.targetFor === t)) return;

        targetInit = true;
        newSignal.targetFor = t;
        newSignal.target = defaultTarget(price);
    });

    $effect(() => {
        ensureLevels(newSignal, t => bySymbol.get(t)?.lastPrice);
    });

    function onTarget(e: Event) {
        const el = e.currentTarget as HTMLInputElement;
        const v = normalizeTarget(el.value);
        if (v !== el.value) el.value = v;
        newSignal.target = v;
    }

    function onLevel(e: Event, i: number) {
        const el = e.currentTarget as HTMLInputElement;
        const v = normalizeTarget(el.value);
        if (v !== el.value) el.value = v;
        newSignal.levels[i] = v;
    }

    function onPeriod({value}: {value: {id: string}}) {
        if (isPctPeriod) newSignal.pctPeriod = value.id as Period;
        else applyStratParam(newSignal, value.id);
    }

    function setMarket(m: Market) {
        if (m === newSignal.market) return;
        applyMarket(newSignal, m, (m === 'perp' ? perpTokens : spotTokens).map(t => getLabel(t.symbol)));
    }

    function setMode(m: Mode) {
        applyMode(newSignal, m, symbols);
    }

    function arrows(e: KeyboardEvent, idx: number, count: number, select: (i: number) => void) {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;

        e.preventDefault();
        const i = (idx + d + count) % count;
        select(i);

        const btns = (e.currentTarget as HTMLElement).parentElement.querySelectorAll<HTMLElement>('[role="tab"]');
        btns[i]?.focus();
    }

    function pickToken(idx: number) {
        slotIdx = idx;
        selectTokenModal?.toShow();
    }

    function onSelect(pair: {name: string}) {
        newSignal.slots[slotIdx] = pair.name;
    }

    function openPro(why: string) {
        pro.pendingCreate = true;
        openProSheet(why, newSignal.market);
    }

    async function create() {
        if (!canCreate || busy) return;

        const why = newSignalView.needPro;
        if (why) {
            openPro(why);
            return;
        }

        busy = true;
        const config = newSignalView.config;
        try {
            await askPush();
            addSignal(await request<SignalRecord>('sig.create', config));
            done = {lines: newSignalView.summaryLines, preview: newSignalView.preview};
            if (needInstallHint()) {
                setInstallHintShown();
                installModal?.toShow();
            } else {
                doneModal?.toShow();
            }
        } catch (e) {
            const why = proReason(e as ErrData, config, me.pro);
            if (why) openPro(why);
        } finally {
            busy = false;
        }
    }

    const resumedAt = untrack(() => pro.resumed);
    $effect(() => {
        if (pro.resumed !== resumedAt) untrack(createPending);
    });

    export function createPending() {
        if (!pro.pendingCreate) return;
        pro.pendingCreate = false;
        void create();
    }

    function finish() {
        doneModal?.toClose();
        resetNewSignal();
        onclose();
    }
</script>

<SelectToken
    bind:pup={selectTokenModal}
    tokens={tokens}
    title={newSignal.mode === 1 ? $_(MARKET_LABELS[newSignal.market]) : roles[slotIdx]}
    used={newSignalView.activeSlots.filter((_t, i) => i !== slotIdx)}
    selected={newSignal.slots[slotIdx]}
    dim={dim}
    onchange={onSelect}/>

<SelectStrategy
    bind:pup={selectStrategyModal}
    strategies={strategies}
    selected={strat.id}
    mode={newSignal.mode}
    subtitle={MODE_LABELS[newSignal.market][newSignal.mode - 1]}
    periodOf={(s: Strategy) => periodOf(newSignal, s)}
    pro={me.pro}
    onchange={(id) => applyStrategy(newSignal, id)}/>

<FundThreshold
    bind:pup={fundModal}
    value={newSignal.fth}
    title={strat.paramLabel}
    subtitle={strat.hint ?? ''}
    onchange={(v) => newSignal.fth = v}/>

<ListSelector
    bind:pup={periodModal}
    instant={true}
    title={isPctPeriod ? $_('PERIOD') : strat.paramLabel}
    subtitle={isPctPeriod ? $_('PCT_PERIOD_HINT') : strat.hint ?? ''}
    lists={periodLists}
    selectedId={isPctPeriod ? newSignal.pctPeriod : stratP}
    onchange={onPeriod}>
    {#snippet badge(item)}
        {#if isPctPeriod && !me.pro && !FREE.pctPeriods.includes(item.id)}
            <ProBadge/>
        {/if}
    {/snippet}
</ListSelector>

<InstallPopup bind:pup={installModal} onclose={() => doneModal?.toShow()}/>

<Popup bind:this={doneModal}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pt-2 pb-2">
            <span class="w-9 h-9 p-2 rounded-full bg-cyan-400/15 text-cyan-200">
                {@html icn.check}
            </span>

            <h2 class="text-lg leading-lg text-white font-light">{$_('SIGNAL_CREATED')}</h2>

            <div class="flex flex-col gap-0.5 text-sm-3 leading-sm-4 font-light text-white">
                {#each done.lines as line}
                    <span>{line}</span>
                {/each}
            </div>

            {@render example(done.preview)}

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                    onclick={finish}>
                {$_('OK')}
            </button>
        </div>
    {/snippet}
</Popup>

{#snippet example(p: Preview)}
    <section class="flex flex-col gap-0.5 p-2 rounded-lg bg-fort-100 border border-fort-300"
             aria-label={$_('NOTIFY_EXAMPLE')}>
        <span class="text-xs-3 leading-xs-3 font-light text-fort-400 uppercase">{$_('NOTIFY_EXAMPLE')}</span>
        <span class="text-sm-3 leading-sm-4 {p?.dim ? 'text-fort-400' : 'text-white'}">{p?.l1}</span>
        <span class="num text-sm leading-sm font-light {p?.dim ? 'text-fort-400' : 'text-fort-500'}">{p?.l2}</span>
    </section>
{/snippet}

<MainTmpl isShowHeader={false} isOverflowScroll={true} isShowFooter={true} bottomPosition={NAV_HEIGHT + (hasLine ? NAV_LINE_HEIGHT : 0)}>
    {#snippet content()}
        <div class="w-full flex flex-col gap-3 {hasLine ? 'pb-34' : 'pb-28'}">
            <div class="flex flex-row items-center gap-2 pt-1">
                <button type="button"
                        class="flex items-center justify-center border border-fort-300 rounded-md w-7 h-7 shrink-0 p-1 text-fort-400"
                        aria-label={$_('BACK')}
                        onclick={onclose}>
                    <i class="h-5 w-5">
                        {@html icn.back}
                    </i>
                </button>

                <h1 class="grow min-w-0 truncate text-sm-3 text-white font-light">{$_('NEW_SIGNAL')}</h1>

                <div class="flex shrink-0 border border-fort-300 rounded-md p-0.5" role="tablist">
                    {#each MARKETS as m, i (m)}
                        <button type="button" role="tab"
                                aria-selected={newSignal.market === m}
                                tabindex={newSignal.market === m ? 0 : -1}
                                class="px-2 py-0.5 rounded-md text-sm font-light
                                       {newSignal.market === m ? 'bg-fort-300 text-white' : 'text-fort-400'}"
                                onclick={() => setMarket(m)}
                                onkeydown={(e) => arrows(e, i, MARKETS.length, (k) => setMarket(MARKETS[k]))}>
                            {$_(MARKET_LABELS[m])}
                        </button>
                    {/each}
                </div>
            </div>

            <ConnectionNotice/>

            <div class="grid grid-cols-3 border border-fort-300 rounded-md p-0.5" role="tablist">
                {#each MODES as m, i (m)}
                    <button type="button" role="tab"
                            aria-selected={newSignal.mode === m}
                            tabindex={newSignal.mode === m ? 0 : -1}
                            class="py-1 rounded-md text-sm font-light truncate
                                   {newSignal.mode === m ? 'bg-fort-300 text-white' : 'text-fort-400'}"
                            onclick={() => setMode(m)}
                            onkeydown={(e) => arrows(e, i, MODES.length, (k) => setMode(MODES[k]))}>
                        {MODE_LABELS[newSignal.market][i]}
                    </button>
                {/each}
            </div>

            <div class="grid gap-2 {newSignal.mode === 1 ? 'grid-cols-1' : newSignal.mode === 2 ? 'grid-cols-2' : 'grid-cols-3'}">
                {#each newSignalView.activeSlots as t, idx (idx)}
                    {@const r = bySymbol.get(t)}
                    <button type="button"
                            class="flex flex-col gap-1 p-2 min-w-0 rounded-md bg-fort-300/60 border border-fort-300 text-left
                                   ripple-container rpl-white"
                            aria-haspopup="dialog"
                            use:addRippleEffect
                            onclick={() => pickToken(idx)}>
                        {#if roles[idx]}
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{roles[idx]}</span>
                        {/if}
                        <span class="w-full flex flex-row justify-between items-baseline gap-1">
                            <span class="text-sm leading-sm text-white font-light truncate">{t}</span>
                            <span class="num text-xs-3 leading-xs-3 text-white font-light truncate {dim ? 'opacity-50' : ''}">{r?.lastPrice ?? ''}</span>
                        </span>
                        <span class="w-full flex flex-row justify-between items-center gap-1">
                            <span class="text-slate-400 text-xs-3 leading-xs-3 font-light truncate">{QUOTE_LABEL[newSignal.market]}</span>
                            {#if r}
                                <span class="num shrink-0 py-0.5 px-1 rounded-md font-light text-xs-2 {getPercentStyle(r.price24hPcnt)} {dim ? 'opacity-50' : ''}">
                                    {getPercent24(r.price24hPcnt)}
                                </span>
                            {/if}
                        </span>
                    </button>
                {/each}
            </div>

            {#if newSignal.mode === 1}
                <div class="grid grid-cols-3 border border-fort-300 rounded-md p-0.5" role="tablist">
                    {#each TABS as tab, i (tab.id)}
                        <button type="button" role="tab"
                                aria-selected={newSignal.tab === tab.id}
                                tabindex={newSignal.tab === tab.id ? 0 : -1}
                                class="py-1 rounded-md text-sm font-light truncate
                                       {newSignal.tab === tab.id ? 'bg-fort-300 text-white' : 'text-fort-400'}"
                                onclick={() => newSignal.tab = tab.id}
                                onkeydown={(e) => arrows(e, i, TABS.length, (k) => newSignal.tab = TABS[k].id)}>
                            {$_(tab.label)}
                        </button>
                    {/each}
                </div>
            {/if}

            {#if newSignal.mode === 1 && newSignal.tab === 'price'}
                <div class="flex flex-col gap-1">
                    <label for="target_price" class="text-sm leading-sm text-fort-400 font-light">
                        {$_('TARGET_PRICE_LABEL')}
                    </label>
                    <input id="target_price"
                           type="text"
                           inputmode="decimal"
                           autocomplete="off"
                           class="num w-full border-b-2 rounded-md py-1 px-2 bg-fort-300 text-white text-sm-3 outline-none
                                  {newSignalView.targetError ? 'border-error-250' : 'border-zinc-700 focus:border-sky-300'}"
                           aria-invalid={newSignalView.targetError}
                           aria-describedby="target_price_note"
                           value={newSignal.target}
                           oninput={onTarget}>
                    <span id="target_price_note"
                          class="text-sm leading-sm text-error-250 font-light"
                          hidden={!newSignalView.targetError}>
                        {$_('TARGET_PRICE_ERROR')}
                    </span>
                </div>
            {:else if newSignal.mode === 1 && newSignal.tab === 'pct'}
                <div class="flex flex-col gap-2">
                    <span id="pct_label" class="text-sm leading-sm text-fort-400 font-light">{$_('PRICE_CHANGE')}</span>
                    <span class="num text-center text-3xl leading-3xl font-bold
                                 {newSignal.pct > 0 ? 'text-green-300' : newSignal.pct < 0 ? 'text-error-250' : 'text-fort-400'}">
                        {pctLabel}
                    </span>
                    <Slider min={newSignal.abs ? 0 : -25}
                            max={25}
                            step={0.5}
                            value={newSignal.pct}
                            isShowValue={false}
                            labels={newSignal.abs ? ['0', '±25%'] : [MINUS + '25%', '0', '+25%']}
                            ariaValuetext={pctLabel}
                            ariaLabelledby="pct_label"
                            onchange={(v) => newSignal.pct = v}/>
                </div>

                <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2 flex items-center">
                        <Checkbox value={newSignal.abs}
                                  classes="items-center text-left"
                                  checkClasses="w-5 h-5"
                                  onclick={(v) => applyAbs(newSignal, v)}>
                            {#snippet item()}
                                <span class="flex flex-col min-w-0">
                                    <span class="text-sm-3 leading-sm-4 text-white font-light">{$_('BOTH_WAYS')}</span>
                                    <span class="text-sm leading-sm text-fort-400 font-light">{$_('BOTH_WAYS_HINT')}</span>
                                </span>
                            {/snippet}
                        </Checkbox>
                    </div>

                    <button type="button"
                            class="flex flex-row justify-between items-center gap-1 p-2 min-w-0 rounded-md
                                   bg-fort-300/60 border border-fort-300 text-left"
                            aria-haspopup="dialog"
                            aria-label="{$_('PERIOD')}: {newSignal.pctPeriod}"
                            onclick={() => periodModal?.toShow()}>
                        <span class="flex flex-col min-w-0">
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{$_('PERIOD')}</span>
                            <span class="num text-sm-3 leading-sm-4 text-white font-light">{newSignal.pctPeriod}</span>
                        </span>
                        <span class="w-3 h-3 shrink-0 fill-fort-400" aria-hidden="true">{@html icn.caret}</span>
                    </button>
                </div>
                <div class="-mt-1 px-0.5 text-sm leading-sm text-fort-400 font-light">{pctAgoText(newSignal.pctPeriod)}</div>
            {:else}
                <div class="grid grid-cols-3 gap-2">
                    <button type="button"
                            class="{strat.id === 'ratio' ? 'col-span-3' : 'col-span-2'} flex flex-row justify-between items-center gap-1 p-2 min-w-0 rounded-md
                                   bg-fort-300/60 border border-fort-300 text-left"
                            aria-haspopup="dialog"
                            aria-label="{$_('STRATEGY')}: {strat.ru}"
                            onclick={() => selectStrategyModal?.toShow()}>
                        <span class="flex flex-col min-w-0">
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{$_('STRATEGY')}</span>
                            <span class="text-sm-3 leading-sm-4 text-white font-light truncate">{strat.en}</span>
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{strat.ru}</span>
                        </span>
                        <span class="w-3 h-3 shrink-0 fill-fort-400" aria-hidden="true">{@html icn.caret}</span>
                    </button>

                    {#if strat.id === 'ratio'}
                    {:else if strat.fixed}
                        <div class="flex flex-col p-2 min-w-0 rounded-md border border-fort-300"
                             role="group"
                             aria-label="{strat.paramLabel} {stratP}, {$_('FIXED')}">
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{strat.paramLabel}</span>
                            <span class="num text-sm-3 leading-sm-4 text-fort-500 font-light">{stratP}</span>
                            <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{$_('FIXED')}</span>
                        </div>
                    {:else}
                        <button type="button"
                                class="flex flex-row justify-between items-center gap-1 p-2 min-w-0 rounded-md
                                       bg-fort-300/60 border border-fort-300 text-left"
                                aria-haspopup="dialog"
                                aria-label="{strat.paramLabel}: {stratP}"
                                onclick={() => (strat.id === 'fund' ? fundModal : periodModal)?.toShow()}>
                            <span class="flex flex-col min-w-0">
                                <span class="text-xs-3 leading-xs-3 font-light text-fort-400 truncate">{strat.paramLabel}</span>
                                <span class="num text-sm-3 leading-sm-4 text-white font-light truncate">{stratP}</span>
                            </span>
                            <span class="w-3 h-3 shrink-0 fill-fort-400" aria-hidden="true">{@html icn.caret}</span>
                        </button>
                    {/if}
                </div>

                {#if strat.id === 'ratio'}
                    <div class="grid gap-2 {newSignal.mode === 3 ? 'grid-cols-2' : 'grid-cols-1'}">
                        {#each newSignalView.activeSlots.slice(1) as t, i (i)}
                            {@const bad = isTargetError(newSignal.levels[i])}
                            <div class="flex flex-col gap-1 min-w-0">
                                <label for="ratio_level_{i}" class="text-sm leading-sm text-fort-400 font-light truncate">
                                    {levelLabel(strat, newSignal.slots[0], t)}
                                </label>
                                <input id="ratio_level_{i}"
                                       type="text"
                                       inputmode="decimal"
                                       autocomplete="off"
                                       class="num w-full h-11 border-b-2 rounded-md px-2 bg-fort-300 text-white text-base outline-none
                                              {bad ? 'border-error-250' : 'border-zinc-700 focus:border-sky-300'}"
                                       aria-invalid={bad}
                                       value={newSignal.levels[i]}
                                       oninput={(e) => onLevel(e, i)}>
                            </div>
                        {/each}
                    </div>
                {/if}

                <StrategyDetail strategy={strat} mode={newSignal.mode} period={stratP}/>
            {/if}

            <div class="flex flex-row justify-between items-center gap-2">
                <div class="flex flex-col min-w-0">
                    <span id="repeat_title" class="text-sm-3 leading-sm-4 text-white font-light">{$_('REPEAT')}</span>
                    <span class="text-sm leading-sm text-fort-400 font-light">{newSignalView.repeatCaption}</span>
                </div>
                <Toggle value={newSignal.repeat[kind]}
                        label=""
                        labelledby="repeat_title"
                        onchange={(v) => newSignal.repeat[kind] = v}/>
            </div>

            {@render example(newSignalView.preview)}
        </div>
    {/snippet}

    {#snippet footer()}
        <div class="w-full px-1">
            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4
                           {canCreate ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                    disabled={!canCreate || busy}
                    onclick={create}>
                {$_('CREATE_SIGNAL')}
                {#if newSignalView.needPro}
                    <ProBadge classes={canCreate ? 'bg-fort-100/15 text-fort-100' : 'bg-fort-400/15 text-fort-400'}/>
                {/if}
            </button>
        </div>
    {/snippet}
</MainTmpl>
