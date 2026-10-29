<script lang="ts">
    import {dateLong, money, receiptDate, snoName} from "../../core/utils/pay.util";
    import {rub} from "../../core/utils/new-signal.util";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {PLAN_NAMES} from "@shared";
    import {pay} from "../../core/store/pay.svelte";
    import {me} from "../../core/store/me.svelte";
    import {closeSheet, nextReceipt, openReceipt, payBack, payNow} from "../services/pay.service";
    import {getKey} from "../services/license.service";
    import Popup from "./popup-tmpl.component.svelte";
    import QrCode from "./qr-code.svelte";
    import Loader from "./loader.svelte";
    import {icons} from "../../assets/icons/icons";
    import {_} from "svelte-i18n";

    const checkIcn = icons().check;

    let plan = $derived(PLAN_NAMES[pay.plan]);
    let r = $derived(pay.receipts[pay.receiptAt] ?? pay.receipt);
    let key = $derived(pay.sheet === 'active' ? getKey() ?? '' : '');
</script>

<Popup isShow={pay.sheet === 'sbp'} is_closable={false} is_locked={pay.busy} isShowBack={true} onback={payBack} onclose={closeSheet} title={$_('PAY_SBP_TITLE')} subtitle="PRO · {plan}">
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 rounded-lg border border-fort-300">
                <div class="flex flex-col gap-1 min-w-0">
                    <span class="text-sm leading-sm text-fort-400 font-light">{$_('TO_PAY')}</span>
                    <span class="num text-lg leading-lg text-white font-bold">{rub(pay.invoice?.amountRub ?? 0)}</span>
                    <span class="mt-1 text-sm leading-sm text-fort-400 font-light">{$_('PAY_PURPOSE')}</span>
                    <span class="text-sm-3 leading-sm-4 text-white font-light">{pay.invoice?.purpose}</span>
                </div>
                <QrCode text={pay.invoice?.qrPayload ?? ''} label={$_('PAY_QR')}/>
            </div>

            <button type="button"
                    class="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm-4 {pay.busy ? 'bg-fort-300 text-fort-400' : 'bg-cyan-400 text-fort-100'}"
                    disabled={pay.busy}
                    onclick={payNow}>
                {#if pay.busy}
                    <Loader/>
                {/if}
                {$_('PAY_NOW')}
            </button>
            <span class="text-sm leading-sm text-fort-400 font-light">{$_('PAY_STATUS_NOTE')}</span>
        </div>
    {/snippet}
</Popup>

<Popup isShow={pay.sheet === 'active'} is_closable={false} onclose={closeSheet}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pt-2 pb-2">
            <span class="w-9 h-9 p-2 rounded-full bg-cyan-400/15 text-cyan-200">
                {@html checkIcn}
            </span>

            <div class="flex flex-col gap-0.5">
                <h2 class="text-lg leading-lg text-white font-light">{$_('PRO_ACTIVE')}</h2>
                <span class="text-sm leading-sm text-fort-400 font-light">
                    {$_('UNTIL')} <span class="num">{me.paidUntil ? dateLong(me.paidUntil) : ''}</span> · {plan}
                </span>
            </div>

            <span class="text-sm leading-sm text-fort-400 font-light">
                {$_('KEY_LABEL')} <span class="num text-white break-all">{key}</span>. {$_('PRO_ACTIVE_FINE')}
            </span>

            <div class="grid grid-cols-2 gap-2">
                <button type="button"
                        class="h-11 flex items-center justify-center gap-2 rounded-lg border border-fort-300 text-sm-4 font-light {pay.receipt ? 'text-white' : 'text-fort-400'}"
                        disabled={!pay.receipt}
                        onclick={() => openReceipt('active')}>
                    {#if !pay.receipt}
                        <Loader/>
                    {/if}
                    {$_('OPEN_RECEIPT')}
                </button>
                <button type="button"
                        class="h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                        onclick={closeSheet}>
                    {$_('OK')}
                </button>
            </div>
        </div>
    {/snippet}
</Popup>

<Popup isShow={pay.sheet === 'receipt'} is_closable={false} isShowBack={true} onback={payBack} onclose={closeSheet} title={$_('RECEIPT_TITLE')} subtitle={$_('RECEIPT_SUBTITLE')}>
    {#snippet content()}
        {#if r}
            <div class="flex flex-col gap-3 px-1 pb-2">
                <div class="num max-h-[60vh] overflow-y-auto flex flex-col gap-1 p-4 rounded-md bg-neutral-50 text-fort-100 text-sm leading-sm"
                     role="document"
                     aria-label={$_('RECEIPT_TITLE')}>
                    <div class="flex flex-col items-center text-center">
                        <b class="uppercase">{$_('RECEIPT_TITLE')}</b>
                        <span>{$_(r.kind === 'income_return' ? 'RCPT_INCOME_RETURN' : 'RCPT_INCOME')}</span>
                    </div>
                    <div class="flex flex-col items-center text-center">
                        <span>{r.sellerName}</span>
                        <span>{$_('RCPT_INN')} {r.sellerInn}</span>
                    </div>
                    {@render row($_('RCPT_PLACE'), r.place)}
                    {@render row($_('RCPT_SNO'), snoName(r.sno))}
                    {@render hr()}
                    <span>{r.item}</span>
                    {@render row(`${r.qty} × ${money(r.price)}`, `= ${money(r.sum)}`)}
                    {@render row($_('RCPT_SUBJECT'), $_('RCPT_SERVICE'))}
                    {@render row($_('RCPT_METHOD'), $_('RCPT_FULL'))}
                    {@render row($_('RCPT_VAT'), $_('RCPT_NO_VAT'))}
                    {@render hr()}
                    <div class="flex flex-row justify-between gap-2 font-bold">
                        <span>{$_('RCPT_TOTAL')}</span>
                        <span>{money(r.sum)}</span>
                    </div>
                    {@render row($_('RCPT_CASHLESS'), money(r.cashless))}
                    {@render hr()}
                    {@render row($_('RCPT_FNS'), 'nalog.gov.ru')}
                    {@render row($_('RCPT_KKT'), r.kktRn)}
                    {@render row($_('RCPT_FN'), r.fn)}
                    {@render row($_('RCPT_FD'), r.fd)}
                    {@render row($_('RCPT_FP'), r.fp)}
                    {@render row($_('RCPT_DATE'), receiptDate(r.at))}
                    <div class="flex justify-center pt-2">
                        <QrCode text={r.qr} label={$_('RCPT_QR')} classes="w-32 h-32"/>
                    </div>
                </div>

                {#if pay.receipts.length > 1}
                    <button type="button"
                            class="h-11 rounded-lg border border-fort-300 text-sm-4 text-white font-light overflow-hidden ripple-container rpl-white"
                            use:addRippleEffect
                            onclick={nextReceipt}>
                        {$_('RCPT_NEXT')}
                    </button>
                {/if}

                <div class="grid grid-flow-col auto-cols-fr gap-2">
                    {#if r.ofdUrl}
                        <a class="h-11 flex items-center justify-center rounded-lg border border-fort-300 text-sm-4 text-white font-light"
                           href={r.ofdUrl}
                           target="_blank"
                           rel="noopener">
                            {$_('OPEN_AT_OFD')}
                        </a>
                    {/if}
                    <button type="button"
                            class="h-11 rounded-lg text-sm-4 bg-cyan-400 text-fort-100"
                            onclick={closeSheet}>
                        {$_('OK')}
                    </button>
                </div>
            </div>
        {/if}
    {/snippet}
</Popup>

{#snippet row(label: string, value: string)}
    <div class="flex flex-row justify-between gap-2">
        <span>{label}</span>
        <span class="text-right break-all">{value}</span>
    </div>
{/snippet}

{#snippet hr()}
    <div class="my-1 border-t border-dashed border-fort-400"></div>
{/snippet}
