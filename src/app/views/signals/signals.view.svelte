<script lang="ts">
    import type {NewSignalState} from "../../core/utils/new-signal.util";
    import type {Market} from "@shared";
    import {newSignal} from "../../core/store/new-signal.svelte";
    import {activeCount, loadSignals, removeSignal, signals} from "../../core/store/signals.svelte";
    import {canReachServer, connection} from "../../core/store/connection.svelte";
    import {connNotice, isDim} from "../../core/utils/connection-ui.util";
    import ConnectionNotice from "../../shared/lib/connection-notice.svelte";
    import {me, pro} from "../../core/store/me.svelte";
    import MainTmpl from "../../shared/lib/main-tmpl.svelte";
    import SignalCard from "../../shared/lib/signal-card.svelte";
    import NoticeBar from "../../shared/lib/notice-bar.svelte";
    import {enablePush, iosTab, needInstallGate, setInstallHintShown} from "../../shared/services/pwa.service";
    import InstallPopup from "../../shared/lib/install.popup.svelte";
    import {pushNotice} from "../../core/utils/push.util";
    import {push} from "../../core/store/push.svelte";
    import {access, openAccess, openPro as openProSheet} from "../../core/store/access.svelte";
    import ProBadge from "../../shared/lib/pro-badge.svelte";
    import NewSignal from "./new-signal.view.svelte";
    import {icons} from "../../assets/icons/icons";
    import {_} from "../../core/utils/i18";
    import {onMount, untrack} from "svelte";

    const icn = icons();
    const inIosTab = iosTab();

    let draft = $state<NewSignalState | null>(pro.restored ? newSignal : null);
    let deleting = $state<string | null>(null);
    let installOpen = $state(false);
    let gateOpen = $state(false);

    let isCreate = $derived(draft !== null);
    let active = $derived(activeCount());
    let limit = $derived(me.pro ? me.limits.pro.signals : me.limits.free.signals);
    let notice = $derived(connNotice(connection.state, connection.dataAt)
        ? null
        : pushNotice(push.perm, push.asked, signals.list.length > 0, inIosTab));
    let dim = $derived(isDim(connection.state));

    onMount(() => {
        void loadSignals();
    });

    function toCreateSignal() {
        draft = newSignal;
    }

    function toNewSignal() {
        if (needInstallGate()) gateOpen = true;
        else toCreateSignal();
    }

    function toSkipInstall() {
        setInstallHintShown();
        toCreateSignal();
    }

    function toCancelCreateSignal() {
        draft = null;
    }

    const revokedAt = untrack(() => access.revoked);
    $effect(() => {
        if (access.revoked !== revokedAt) draft = null;
    });

    function openPro(market: Market) {
        openProSheet('', market);
    }

    async function toDeleteSignal(id: string) {
        if (deleting) return;
        deleting = id;
        await removeSignal(id);
        deleting = null;
    }
</script>

{#if isCreate}
    <NewSignal onclose={toCancelCreateSignal}/>
{:else}
    <InstallPopup bind:isShow={installOpen}/>
    <InstallPopup bind:isShow={gateOpen} gate onskip={toSkipInstall}/>

    <MainTmpl isShowHeader={false} isOverflowScroll={true}>
        {#snippet content()}
            <div class="w-full flex flex-col gap-2 pb-12">
                <div class="flex flex-row items-center gap-2 pt-1 min-h-8">
                    <h1 class="grow min-w-0 truncate text-sm-3 text-white font-light">
                        {$_('SIGNALS')}
                        <span class="num text-xs-3 text-fort-400">{active}/{limit}</span>
                    </h1>

                    <button type="button"
                            class="flex items-center justify-center h-7 min-w-7 shrink-0 pl-0.5 {me.pro ? 'pr-1' : 'pr-0.5'} border border-fort-300 rounded-md text-cyan-200"
                            aria-label={$_(me.pro ? 'ACCESS_ARIA_PRO' : 'ACCESS_ARIA_FREE')}
                            onclick={openAccess}>
                        <span class="w-5 h-5" aria-hidden="true">{@html icn.key}</span>
                        {#if me.pro}
                            <ProBadge/>
                        {/if}
                    </button>

                    {#if active < limit}
                        <button type="button"
                                class="flex items-center justify-center border border-fort-300 rounded-md w-7 h-7 shrink-0 p-1 text-cyan-200"
                                aria-label={$_('NEW_SIGNAL')}
                                onclick={toNewSignal}>
                            <i class="h-5 w-5">
                                {@html icn.plus}
                            </i>
                        </button>
                    {/if}
                </div>

                <ConnectionNotice/>

                {#if notice === 'install'}
                    <NoticeBar tone="yellow" title={$_('INSTALL_NOTICE_TITLE')} text={$_('INSTALL_NOTICE_TEXT')}>
                        {#snippet action()}
                            <button type="button"
                                    class="ml-1 px-1.5 h-6 rounded-md border border-yellow-400/40 text-xs-3 text-yellow-200"
                                    aria-haspopup="dialog"
                                    onclick={() => installOpen = true}>
                                {$_('INSTALL_BTN')}
                            </button>
                        {/snippet}
                    </NoticeBar>
                {:else if notice === 'default'}
                    <NoticeBar tone="yellow" title={$_('PUSH_OFF_TITLE')} text={$_('PUSH_OFF_TEXT')}>
                        {#snippet action()}
                            <button type="button"
                                    class="ml-1 px-1.5 h-6 rounded-md border border-yellow-400/40 text-xs-3 text-yellow-200"
                                    onclick={enablePush}>
                                {$_('PUSH_ENABLE')}
                            </button>
                        {/snippet}
                    </NoticeBar>
                {:else if notice === 'denied'}
                    <NoticeBar tone="yellow" title={$_('PUSH_DENIED_TITLE')} text={$_('PUSH_DENIED_TEXT')}/>
                {/if}

                {#if signals.list.length === 0 && !canReachServer()}
                    <div class="flex flex-col gap-1">
                        {#each {length: 3}}
                            <div class="h-20 rounded-lg bg-fort-300 animate-pulse"></div>
                        {/each}
                    </div>
                {:else if signals.list.length === 0}
                    <div class="py-12 text-center text-sm text-fort-400 font-light">{$_('NO_SIGNALS')}</div>
                {:else}
                    <div class="flex flex-col gap-1">
                        {#each signals.list as rec (rec.id)}
                            <SignalCard rec={rec}
                                        onpaused={() => openPro(rec.market)}
                                        ondelete={() => toDeleteSignal(rec.id)}
                                        canDelete={!deleting && canReachServer()}
                                        dim={dim}/>
                        {/each}
                    </div>
                {/if}
            </div>
        {/snippet}
    </MainTmpl>
{/if}
