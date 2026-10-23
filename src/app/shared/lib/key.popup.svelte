<script lang="ts">
    import {qrModules, qrPath, QR_MARGIN} from "../../core/utils/license.util";
    import {canDownload, keyPng, saveKeyPng} from "../services/license.service";
    import Popup from "./popup-tmpl.component.svelte";
    import Checkbox from "./checkbox.svelte";
    import Loader from "./loader.svelte";
    import {canReachServer} from "../../core/store/connection.svelte";
    import {termsBlocks} from "../../core/utils/terms.util";
    import termsMd from "../../../../landing/src/pages/terms.md?raw";
    import {TERMS_V} from "@shared";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        key: string;
        busy?: boolean;
        error?: string;
        onpay?: (key: string) => void;
        onback?: () => void;
        onclose?: () => void;
    }

    let {
        pup = $bindable(null),
        key,
        busy = false,
        error = '',
        onpay = () => {},
        onback = () => {},
        onclose = () => {},
    }: Props = $props();

    const COPIED_MS = 1400;
    const terms = termsBlocks(termsMd);

    let saved = $state(false);
    let agreed = $state(false);
    let termsPup: Popup;
    let copied = $state(false);
    let canSave = $state(false);
    let file: Promise<File> | null = null;
    let copiedTimer: ReturnType<typeof setTimeout>;

    let groups = $derived(key.split('-'));
    let modules = $derived(key ? qrModules(key) : []);
    let size = $derived(modules.length + QR_MARGIN * 2);

    function show(back: boolean | null) {
        if (!back) {
            saved = false;
            agreed = false;
        }
        copied = false;
        canSave = canDownload();
        file = canSave ? keyPng(key) : null;
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(key);
        } catch {
            return;
        }
        copied = true;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => copied = false, COPIED_MS);
    }

    async function download() {
        if (file) await saveKeyPng(await file);
    }
</script>

<Popup bind:this={pup} is_closable={false} is_locked={busy} isShowBack={true} onshow={show} onback={onback} onclose={onclose} title={$_('KEY_TITLE')} subtitle={$_('KEY_SUBTITLE')}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 rounded-lg border border-fort-300">
                <div class="flex flex-col gap-2 min-w-0">
                    <span class="text-sm leading-sm text-fort-400 font-light">{$_('KEY_LABEL')}</span>
                    <div class="num text-md leading-md text-white font-bold select-all">
                        {#each groups as g, i}<span class="whitespace-nowrap">{g}{i < groups.length - 1 ? '-' : ''}</span><wbr>{/each}
                    </div>
                </div>
                <svg class="w-26 h-26 rounded-md shrink-0" viewBox="0 0 {size} {size}" shape-rendering="crispEdges" role="img" aria-label={$_('KEY_QR')}>
                    <rect class="fill-white" width={size} height={size}/>
                    <path class="fill-black" d={qrPath(modules)}/>
                </svg>
            </div>

            <div class="grid grid-flow-col auto-cols-fr gap-2">
                <button type="button"
                        class="h-10 rounded-lg border border-fort-300 text-sm-3 text-white font-light"
                        onclick={copy}>
                    {$_(copied ? 'COPIED' : 'COPY')}
                </button>
                {#if canSave}
                    <button type="button"
                            class="h-10 rounded-lg border border-fort-300 text-sm-3 text-white font-light"
                            onclick={download}>
                        {$_('DOWNLOAD_QR')}
                    </button>
                {/if}
            </div>

            <span class="text-sm leading-sm text-fort-400 font-light">{$_('KEY_FINE')}</span>

            <Checkbox bind:value={saved} classes="items-center text-left" checkClasses="w-5 h-5">
                {#snippet item()}
                    <span class="text-sm-3 leading-sm-4 text-white font-light">{$_('KEY_SAVED')}</span>
                {/snippet}
            </Checkbox>

            <div class="flex flex-row flex-wrap items-center gap-x-1">
                <Checkbox bind:value={agreed} isFull={false} classes="items-center text-left" checkClasses="w-5 h-5">
                    {#snippet item()}
                        <span class="text-sm-3 leading-sm-4 text-white font-light">{$_('TERMS_AGREE')}</span>
                    {/snippet}
                </Checkbox>
                <button type="button"
                        class="text-sm-3 leading-sm-4 text-cyan-200 font-light text-left"
                        onclick={() => termsPup.toShow()}>
                    {$_('TERMS_LINK')}
                </button>
            </div>

            <button type="button"
                    class="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm-4 {saved && agreed && !busy && canReachServer() ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'}"
                    disabled={!saved || !agreed || busy || !canReachServer()}
                    onclick={() => onpay(key)}>
                {#if busy}
                    <Loader/>
                {/if}
                {$_('TO_PAY')}
            </button>

            {#if error}
                <span class="text-sm leading-sm text-error-250 font-light" role="alert">{error}</span>
            {/if}
        </div>
    {/snippet}
</Popup>

<Popup bind:this={termsPup} is_swipe_content={false} title={$_('TERMS_TITLE')} subtitle={$_('TERMS_EDITION', {values: {v: TERMS_V}})}>
    {#snippet content()}
        <div class="h-[calc(80vh)] flex flex-col gap-2 overflow-y-auto px-1 pb-2">
            {#each terms as b, i (i)}
                {#if b.level === 2}
                    <h3 class="pt-2 text-sm-4 leading-sm-4 text-white font-normal">{b.text}</h3>
                {:else if b.level === 0}
                    <p class="text-sm-3 leading-base text-fort-500 font-light whitespace-pre-line">{b.text}</p>
                {/if}
            {/each}
        </div>
    {/snippet}
</Popup>
