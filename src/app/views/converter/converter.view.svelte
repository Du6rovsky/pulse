<script lang="ts">
    import {addRippleEffect, inputPattern} from "../../core/utils/toolbox.util";
    import SelectToken from "../../shared/lib/select-token.popup.svelte";
    import {btcPrice$, rates$} from "../../core/store/exchange.store";
    import Popup from "../../shared/lib/popup-tmpl.component.svelte";
    import MainTmpl from "../../shared/lib/main-tmpl.svelte";
    import ConnectionNotice from "../../shared/lib/connection-notice.svelte";
    import {icons} from "../../assets/icons/icons";
    import {get} from "svelte/store";
    import {onMount} from "svelte";

    const minValue = 1;
    const maxValue = 999999999999;
    const maxLength = 30;
    const swapIcn = icons().swap;
    let isInit = $state(false);

    let form = $state({
        from: {
            name: "BTC",
            value: 1,
            rate: get(btcPrice$),
        },
        to: {
            name: "USDC",
            value: 1,
            rate: 1,
        },
    })
    const subUSD = 'USD';

    let selectTokenModal = $state<Popup>(null);
    let targetSearch = $state('');

    onMount(() => {
        btcPrice$.subscribe((result) => {
            if (!isInit) {
                form.from.rate = result?.lastPrice;
                form.to.value = result?.lastPrice;

                isInit = true;
            }
        })
    })

    function switchForm() {
        const formCopy = JSON.parse(JSON.stringify(form));

        form.from = formCopy.to;
        form.from.value = formCopy.from.value;
        form.to = formCopy.from;
        form.to.value = formCopy.to.value;

        changeFromValue();
    }

    function toggleSearch(target?: any | string) {
        targetSearch = target;
        selectTokenModal?.toShow();
    }

    function selectPair(pair: any) {
        form[targetSearch].name = pair?.name;
        form[targetSearch].rate = pair?.rate;

        changeFromValue();
    }

    function changeFromValue(_e?: Event) {
        const input_ = prepareForMath(form?.from?.value);

        if (!isNaN(input_)) {
            let val = (input_ * form.from.rate) / form.to.rate;
            form.to.value = Math.trunc(val * 100000000) / 100000000;

            form.from.value = input_;
        }
    }

    function changeToValue(_e?: Event) {
        const input_ = prepareForMath(form?.to?.value);

        if (!isNaN(input_)) {
            let val = (form.to.rate / form.from.rate) * input_;
            form.from.value = Math.trunc(val * 100000000) / 100000000;

            form.to.value = input_;
        }
    }

    function prepareForMath(val) {
        val += '';

        const dotCount = (val.match(/\./g) || []).length;

        if (dotCount > 1) {
            const firstDotIndex = val.indexOf('.');

            return +(val.slice(0, firstDotIndex + 1) +
                val.slice(firstDotIndex + 1).replace(/\./g, ''));
        } else {
            return val;
        }
    }
</script>

<SelectToken
    bind:pup={selectTokenModal}
    onchange={selectPair}/>

<MainTmpl isShowHeader={false} isOverflowScroll={true}>
    {#snippet content()}
        <ConnectionNotice classes="pt-1"/>
        <div class="w-full flex flex-col gap-1 overflow-hidden border border-fort-300 rounded-md mt-1 bg-fort-100">
            <div class="flex flex-row justify-between pt-1 pr-1">
                <button class="flex flex-col items-end justify-end grow rounded-md text-white mr-8
                                   relative gap-0.5 ripple-container rpl-white"
                        use:addRippleEffect
                        onclick={() => toggleSearch('from')}>
                        <span class="text-slate-400 text-end font-light leading-3 text-xs-3">
                            {(form?.from?.rate ?? '') + ' ' + subUSD}
                        </span>

                    <span class="leading-3 font-light text-right">
                        {form?.from?.name}
                    </span>
                </button>

                <input
                    class="w-2/3 appearance-none border-b-2 border-zinc-700 rounded-md py-1 px-2 text-white leading-tight
            bg-fort-300 focus:outline-none focus:border-sky-300 font-sans font-light text-right text-sm"
                    id="from"
                    type="text"
                    min={minValue}
                    max={maxValue}
                    maxlength={maxLength}
                    inputmode="numeric"
                    oninput={(e) => {
                                changeFromValue(e);
                                return inputPattern(e);
                            }}
                    onkeypress={inputPattern}
                    bind:value={form.from.value}>
            </div>

            <div class="w-full flex flex-row h-0.5 items-center justify-between gap-1">

                <div class="h-px flex grow bg-fort-300"></div>

                <button class="flex w-6 h-6 items-center justify-center rounded-full border border-fort-300
                                   overflow-hidden ripple-container rpl-white"
                        use:addRippleEffect
                        onclick={switchForm}>
                    <i class="h-4 w-4 text-white fill-white">
                        {@html swapIcn}
                    </i>
                </button>

                <div class="h-px flex w-2/3 bg-fort-300"></div>
            </div>

            <div class="flex flex-row justify-between pb-1 pr-1">
                <button
                    onclick={() => toggleSearch('to')}
                    use:addRippleEffect
                    class="flex flex-col items-end justify-center grow rounded-md font-light text-white mr-8
                                   relative gap-0.5 ripple-container rpl-white">
                        <span class="leading-3 font-light text-right">
                            {form?.to?.name}
                        </span>

                    <span class="text-slate-400 text-end font-light text-xs-3 leading-3">
                        {(form?.to?.rate ?? '') + ' ' + subUSD}
                    </span>
                </button>

                <input
                    class="w-2/3 appearance-none border-b-2 border-zinc-700 rounded-md py-1 px-2 text-white leading-tight
            bg-fort-300 focus:outline-none focus:border-sky-300 font-sans font-light text-right text-sm"
                    id="to"
                    type="text"
                    min={minValue}
                    max={maxValue}
                    maxlength={maxLength}
                    inputmode="numeric"
                    oninput={(e) => {
                                changeToValue(e);
                                return inputPattern(e);
                            }}
                    onkeypress={inputPattern}
                    bind:value={form.to.value}>
            </div>
        </div>
    {/snippet}
</MainTmpl>