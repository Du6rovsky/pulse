<script lang="ts">
    import type {NewSignalState} from "../../core/utils/new-signal.util";
    import type {Market} from "@shared";
    import {newSignal} from "../../core/store/new-signal.svelte";
    import {activeCount, loadSignals, removeSignal, signals} from "../../core/store/signals.svelte";
    import {canReachServer, connection} from "../../core/store/connection.svelte";
    import {connNotice, isDim, statusLine} from "../../core/utils/connection-ui.util";
    import ConnectionNotice from "../../shared/lib/connection-notice.svelte";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {me, pro} from "../../core/store/me.svelte";
    import MainTmpl from "../../shared/lib/main-tmpl.svelte";
    import SignalCard from "../../shared/lib/signal-card.svelte";
    import NoticeBar from "../../shared/lib/notice-bar.svelte";
    import {enablePush, iosTab, needInstallGate, setInstallHintShown} from "../../shared/services/pwa.service";
    import InstallPopup from "../../shared/lib/install.popup.svelte";
    import {pushNotice} from "../../core/utils/push.util";
    import {push} from "../../core/store/push.svelte";
    import {access, openAccess, openPro as openProSheet} from "../../core/store/access.svelte";
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
    let hasLine = $derived(statusLine(connection.state) !== null);

    onMount(() => {
        void loadSignals();
    });

    function toCreateSignal() {
        draft = newSignal;
    }

    function toNewSignal() {
        if (active >= limit) openAccess();
        else if (needInstallGate()) gateOpen = true;
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
            <div class="w-full flex flex-col gap-2 {hasLine ? 'pb-40' : 'pb-35'}">
                <div class="flex flex-row items-center gap-2 pt-1 min-h-8">
                    <h1 class="grow min-w-0 truncate text-sm-3 text-white font-light">
                        {$_('SIGNALS')}
                        <span class="num text-xs-3 text-fort-400">{active}/{limit}</span>
                    </h1>

                    <button type="button"
                            class="flex items-center gap-1 h-7 shrink-0 {me.pro ? 'pl-[3px]' : 'pl-1'} pr-2 rounded-md bg-fort-100 border border-fort-300
                                   text-sm-3 font-light text-cyan-200 overflow-hidden ripple-container rpl-white"
                            aria-label={$_(me.pro ? 'ACCESS_ARIA_PRO' : 'ACCESS_ARIA_FREE')}
                            use:addRippleEffect
                            onclick={openAccess}>
                        {#if me.pro}
                            <span class="flex items-center h-5 px-1.5 rounded-md bg-cyan-400/15 font-bold">PRO</span>
                        {/if}
                        <i class="h-5 w-5">
                            {@html icn.key}
                        </i>
                        {$_('ACCESS')}
                    </button>
                </div>

                <ConnectionNotice/>

                {#if notice === 'install'}
                    <NoticeBar tone="yellow" title={$_('INSTALL_NOTICE_TITLE')} text={$_('INSTALL_NOTICE_TEXT')}>
                        {#snippet action()}
                            <button type="button"
                                    class="ml-1 px-1.5 h-6 rounded-md border border-yellow-400/40 text-xs-3 text-yellow-200
                                           overflow-hidden ripple-container rpl-white"
                                    aria-haspopup="dialog"
                                    use:addRippleEffect
                                    onclick={() => installOpen = true}>
                                {$_('INSTALL_BTN')}
                            </button>
                        {/snippet}
                    </NoticeBar>
                {:else if notice === 'default'}
                    <NoticeBar tone="yellow" title={$_('PUSH_OFF_TITLE')} text={$_('PUSH_OFF_TEXT')}>
                        {#snippet action()}
                            <button type="button"
                                    class="ml-1 px-1.5 h-6 rounded-md border border-yellow-400/40 text-xs-3 text-yellow-200
                                           overflow-hidden ripple-container rpl-white"
                                    use:addRippleEffect
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

    {#if active < limit || !me.pro}
        <div class="max-w-104 fixed inset-x-4 mx-auto flex justify-end z-1000 pointer-events-none
                    mb-safe-nav {hasLine ? 'bottom-21.5' : 'bottom-16.5'}">
            <button type="button"
                    class="flex items-center justify-center w-14 h-14 rounded-full bg-cyan-400 text-fort-100
                           pointer-events-auto overflow-hidden ripple-container rpl-white"
                    aria-label={$_('NEW_SIGNAL')}
                    use:addRippleEffect
                    onclick={toNewSignal}>
                <i class="h-6 w-6">
                    {@html icn.plus}
                </i>
            </button>
        </div>
    {/if}
{/if}
