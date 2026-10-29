<script lang="ts">
    import type {ErrData, PlanId} from "@shared";
    import {access, accessBack, closeAccess, openPro, openRestore, type AccessSheet} from "../../core/store/access.svelte";
    import {me, pro} from "../../core/store/me.svelte";
    import {pay} from "../../core/store/pay.svelte";
    import {canReachServer} from "../../core/store/connection.svelte";
    import {canLogin, compareRows, fileError, QR_TYPES} from "../../core/utils/access.util";
    import {keyInput} from "../../core/utils/license.util";
    import {dateLong, readReceipt, readRefundReceipts} from "../../core/utils/pay.util";
    import {rubNum} from "../../core/utils/new-signal.util";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {activateByKey, ensureKey, getKey, keyFromFile} from "../services/license.service";
    import {disablePro, loadDisableQuote, openDisable, openReceipt, startPay} from "../services/pay.service";
    import ProPopup from "./pro.popup.svelte";
    import KeyPopup from "./key.popup.svelte";
    import Popup from "./popup-tmpl.component.svelte";
    import {icons} from "../../assets/icons/icons";
    import {_} from "../../core/utils/i18";
    import {untrack} from "svelte";

    const COPIED_MS = 1400;
    const checkIcn = icons().check;
    const BTN_SEC = 'h-11 rounded-lg border border-fort-300 text-sm-4 font-light';

    let proModal = $state<Popup>(null);
    let keyModal = $state<Popup>(null);

    let online = $derived(canReachServer());
    let rows = $derived(compareRows(me.limits));
    let until = $derived(me.paidUntil ? dateLong(me.paidUntil) : '');
    let ownKey = $derived(access.sheet === 'access' && me.pro ? getKey() ?? '' : '');
    let receipt = $derived(access.sheet === 'access' && me.pro ? pay.receipt ?? readReceipt() : null);
    let refundReceipts = $derived(access.sheet === 'access' ? pay.refunds ?? readRefundReceipts() : []);
    let copied = $state(false);
    let copiedTimer: ReturnType<typeof setTimeout>;

    let rk = $state('');
    let note = $state('');
    let noteErr = $state(false);
    let busy = $state(false);
    let reading = $state(false);
    let locked = $state(false);
    let lockTimer: ReturnType<typeof setTimeout>;
    let fileInput: HTMLInputElement = $state(null);
    let ready = $derived(canLogin(rk, online, locked, busy || reading));

    let prev: AccessSheet = null;
    $effect(() => {
        const s = access.sheet;
        untrack(() => {
            const back = access.back;
            access.back = false;
            if (prev === 'pro' && s !== 'pro') proModal?.toClose();
            if (prev === 'key' && s !== 'key') keyModal?.toClose();
            if (s === 'pro' && prev !== 'pro') proModal?.toShow(back ? access.plan : null);
            if (s === 'key' && prev !== 'key') keyModal?.toShow(back);
            if (s === 'restore' && !locked) setNote('');
            prev = s;
        });
    });

    $effect(() => {
        const show = access.sheet === 'access' && me.pro;
        const reach = online;
        if (show) untrack(() => loadDisableQuote(reach));
    });

    async function toKey(plan: PlanId) {
        if (access.busy) return;
        access.busy = true;
        access.error = '';
        try {
            access.key = await ensureKey(plan);
            access.plan = plan;
            pay.error = '';
            access.sheet = 'key';
        } catch (e) {
            access.error = (e as Partial<ErrData>)?.message ?? '';
        } finally {
            access.busy = false;
        }
    }

    async function toPay() {
        if (await startPay(access.key, access.plan)) closeAccess('key');
    }

    async function copyKey() {
        try {
            await navigator.clipboard.writeText(ownKey);
        } catch {
            return;
        }
        copied = true;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => copied = false, COPIED_MS);
    }

    function toReceipt() {
        pay.receipt = receipt;
        closeAccess('access');
        openReceipt('access');
    }

    function toRefundReceipt() {
        const list = refundReceipts;
        closeAccess('access');
        openReceipt('access', list);
    }

    function setNote(text: string, err = false) {
        note = text;
        noteErr = err;
    }

    function onKey(e: Event) {
        const el = e.currentTarget as HTMLInputElement;
        const v = keyInput(el.value);
        if (v !== el.value) el.value = v;
        rk = v;
        if (!locked) setNote('');
    }

    function lock(sec: number) {
        locked = true;
        clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
            locked = false;
            setNote('');
        }, sec * 1000);
    }

    async function login() {
        if (!ready) return;
        busy = true;
        setNote('');
        try {
            await activateByKey(rk);
            rk = '';
            access.sheet = 'restored';
        } catch (e) {
            const err = e as Partial<ErrData>;
            setNote(err?.message ?? '', true);
            if (err?.code === 'LIC_TOO_MANY') lock(err.retryIn ?? 60);
        } finally {
            busy = false;
        }
    }

    async function onFile(e: Event) {
        const el = e.currentTarget as HTMLInputElement;
        const file = el.files?.[0];
        el.value = '';
        if (!file) return;

        const bad = fileError(file);
        if (bad) {
            setNote($_(bad), true);
            return;
        }

        reading = true;
        setNote($_('RK_READING'));
        let key: string | null;
        try {
            key = await keyFromFile(file);
        } finally {
            reading = false;
        }
        if (!key) {
            setNote($_('RK_NO_QR'), true);
            return;
        }
        rk = keyInput(key);
        setNote('');
        await login();
    }

    function closeRestored() {
        closeAccess('restored');
        if (pro.pendingCreate) pro.resumed++;
    }
</script>

<ProPopup
    bind:pup={proModal}
    me={me}
    market={access.market}
    reason={access.reason}
    busy={access.busy}
    error={access.error}
    oncontinue={toKey}
    onrestore={openRestore}
    onclose={() => closeAccess('pro')}/>

<KeyPopup
    bind:pup={keyModal}
    key={access.key}
    busy={pay.busy}
    error={pay.error}
    onpay={toPay}
    onback={accessBack}
    onclose={() => closeAccess('key')}/>

<Popup isShow={access.sheet === 'access'}
       onclose={() => closeAccess('access')}
       title={$_('ACCESS')}
       subtitle={me.pro ? $_('ACC_PRO_UNTIL', {values: {at: until}}) : $_('ACC_FREE_PLAN')}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <div class="grid grid-cols-[minmax(0,1fr)_5.25rem_4.5rem] border border-fort-300 rounded-lg overflow-hidden text-sm leading-sm font-light"
                 role="table"
                 aria-label={$_('ACC_TABLE')}>
                <div class="contents" role="row">
                    <div class="py-2" role="columnheader"></div>
                    <div class="py-2 text-center font-bold text-fort-400" role="columnheader">{$_('ACC_COL_FREE')}</div>
                    <div class="py-2 text-center font-bold bg-cyan-400/15 text-cyan-200" role="columnheader">PRO</div>
                </div>
                {#each rows as r (r.label)}
                    <div class="contents" role="row">
                        <div class="py-2 pl-3 pr-1 border-t border-fort-300 text-fort-400" role="rowheader">{$_(r.label)}</div>
                        <div class="num py-2 px-1 border-t border-fort-300 text-center text-fort-400" role="cell">{r.free}</div>
                        <div class="num py-2 px-1 border-t border-fort-300 text-center bg-cyan-400/15 text-cyan-200" role="cell">{r.pro}</div>
                    </div>
                {/each}
            </div>

            {#if me.pro}
                {#if access.refundRub > 0}
                    <button type="button"
                            class="{BTN_SEC} {online && !access.busy ? 'text-white' : 'text-fort-400'}"
                            disabled={!online || access.busy}
                            onclick={openDisable}>
                        {$_('DISABLE_PRO')}
                    </button>
                {/if}

                <div class="flex flex-col gap-2 p-3 rounded-lg border border-fort-300">
                    <span class="text-sm leading-sm text-fort-400 font-light">{$_('KEY_LABEL')}</span>
                    <div class="num text-md leading-md text-white font-bold select-all">
                        {#each ownKey.split('-') as g, i}<span class="whitespace-nowrap">{g}{i < 4 ? '-' : ''}</span><wbr>{/each}
                    </div>
                </div>

                <span class="text-sm leading-sm text-fort-400 font-light">{$_('ACC_PRO_FINE')}</span>

                {#if receipt}
                    <button type="button" class="{BTN_SEC} text-white" onclick={toReceipt}>
                        {$_('OPEN_RECEIPT')}
                    </button>
                {/if}

                {#if refundReceipts.length}
                    <button type="button" class="{BTN_SEC} text-white" onclick={toRefundReceipt}>
                        {$_('REFUND_RECEIPT')}
                    </button>
                {/if}

                <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="{BTN_SEC} text-white overflow-hidden ripple-container rpl-white" use:addRippleEffect onclick={copyKey}>
                        {$_(copied ? 'COPIED' : 'COPY_KEY')}
                    </button>
                    <button type="button"
                            class="h-11 rounded-lg text-sm-4 {online ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                            disabled={!online}
                            onclick={() => openPro($_('RENEW_REASON'))}>
                        {$_('RENEW')}
                    </button>
                </div>
            {:else}
                <span class="text-sm leading-sm text-fort-400 font-light">{$_('ACC_FREE_FINE')}</span>

                <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="{BTN_SEC} text-white" onclick={openRestore}>
                        {$_('LOGIN_BY_KEY')}
                    </button>
                    <button type="button"
                            class="h-11 rounded-lg text-sm-4 {online ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                            disabled={!online}
                            onclick={() => openPro()}>
                        {$_('BUY_PRO')}
                    </button>
                </div>

                {#if refundReceipts.length}
                    <button type="button" class="{BTN_SEC} text-white" onclick={toRefundReceipt}>
                        {$_('REFUND_RECEIPT')}
                    </button>
                {/if}
            {/if}
        </div>
    {/snippet}
</Popup>

<Popup isShow={access.sheet === 'disable'}
       isShowBack={true}
       onback={accessBack}
       onclose={() => closeAccess('disable')}
       title={$_('DISABLE_PRO')}
       subtitle={$_('ACC_PRO_UNTIL', {values: {at: until}})}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <ul class="flex flex-col gap-1.5 pl-5 list-disc marker:text-fort-400 text-sm-3 leading-sm-4 text-white font-light">
                <li>{$_('DISABLE_PRO_UNTIL', {values: {at: dateLong(access.refundUntil)}})}</li>
                <li>{$_('DISABLE_SIGNALS')}</li>
                <li>{$_('DISABLE_KEY')}</li>
                {#if access.refundRub > 0}
                    <li>{$_('DISABLE_REFUND', {values: {sum: rubNum(access.refundRub)}})}</li>
                {/if}
            </ul>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 {online && !access.busy ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                    disabled={!online || access.busy}
                    onclick={disablePro}>
                {$_('DISABLE_PRO')}
            </button>

            {#if access.error}
                <span class="text-sm leading-sm text-error-250 font-light" role="alert">{access.error}</span>
            {/if}
        </div>
    {/snippet}
</Popup>

<Popup isShow={access.sheet === 'restore'}
       isShowBack={true}
       onback={accessBack}
       onclose={() => closeAccess('restore')}
       title={$_('RK_TITLE')}
       subtitle={$_('RK_SUBTITLE')}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <div class="flex flex-col gap-1.5">
                <input class="num w-full h-11 px-2.5 rounded-lg bg-fort-200 border text-sm-4 text-white uppercase outline-none placeholder:text-fort-400 {noteErr && online ? 'border-error-250' : 'border-fort-300 focus:border-cyan-200'}"
                       type="text"
                       inputmode="text"
                       autocomplete="off"
                       autocapitalize="characters"
                       spellcheck="false"
                       placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                       aria-label={$_('KEY_LABEL')}
                       aria-describedby="rk_note"
                       aria-invalid={noteErr && online}
                       value={rk}
                       oninput={onKey}>
                <span id="rk_note"
                      class="min-h-4 text-sm leading-sm font-light {noteErr && online ? 'text-error-250' : 'text-fort-400'}"
                      role={noteErr ? 'alert' : 'status'}>
                    {online ? note : $_('RK_OFFLINE')}
                </span>
            </div>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 {ready ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                    disabled={!ready}
                    onclick={login}>
                {$_('RK_LOGIN')}
            </button>

            <div class="flex flex-row items-center gap-2.5 text-sm leading-sm text-fort-400 font-light">
                <span class="grow border-t border-fort-300"></span>
                {$_('RK_OR')}
                <span class="grow border-t border-fort-300"></span>
            </div>

            <button type="button"
                    class="{BTN_SEC} {online && !reading ? 'text-white' : 'text-fort-400'} overflow-hidden ripple-container rpl-white"
                    disabled={!online || reading || busy}
                    use:addRippleEffect
                    onclick={() => fileInput?.click()}>
                {$_('RK_FILE')}
            </button>
            <input bind:this={fileInput} class="hidden" type="file" accept={QR_TYPES.join(',')} onchange={onFile}>

            <span class="text-sm leading-sm text-fort-400 font-light">{$_('RK_FINE')}</span>
        </div>
    {/snippet}
</Popup>

<Popup isShow={access.sheet === 'restored'} onclose={closeRestored}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pt-2 pb-2">
            <span class="w-9 h-9 p-2 rounded-full bg-cyan-400/15 text-cyan-200">
                {@html checkIcn}
            </span>

            <div class="flex flex-col gap-0.5">
                <h2 class="text-lg leading-lg text-white font-light">{$_('PRO_ACTIVE')}</h2>
                <span class="text-sm leading-sm text-fort-400 font-light">
                    {$_('UNTIL')} <span class="num">{until}</span>
                </span>
            </div>

            <span class="text-sm leading-sm text-fort-400 font-light">{$_('RK_RESTORED')}</span>

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                    onclick={closeRestored}>
                {$_('OK')}
            </button>
        </div>
    {/snippet}
</Popup>

<Popup isShow={access.sheet === 'revoked'} onclose={() => closeAccess('revoked')} title={$_('REVOKED_TITLE')}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <p class="text-sm-3 leading-sm-4 font-light text-white">{$_('REVOKED_TEXT')}</p>

            <div class="grid grid-cols-2 gap-2">
                <button type="button" class="{BTN_SEC} text-white" onclick={openRestore}>
                    {$_('LOGIN_BY_KEY')}
                </button>
                <button type="button"
                        class="h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                        onclick={() => closeAccess('revoked')}>
                    {$_('GOT_IT')}
                </button>
            </div>
        </div>
    {/snippet}
</Popup>
