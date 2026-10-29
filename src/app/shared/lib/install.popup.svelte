<script lang="ts">
    import Popup from "./popup-tmpl.component.svelte";
    import {deviceInstallTarget, promptInstall} from "../services/pwa.service";
    import {install} from "../../core/store/install.svelte";
    import {stepParts} from "../../core/utils/install.util";
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {APP_HOST} from "../services/api.service";
    import {icons} from "../../assets/icons/icons";
    import {_} from "svelte-i18n";

    type Props = {
        pup?: Popup;
        isShow?: boolean;
        pay?: boolean;
        gate?: boolean;
        onclose?: () => void;
        onskip?: () => void;
    }

    let {
        pup = $bindable(null),
        isShow = $bindable(false),
        pay = false,
        gate = false,
        onclose = () => {},
        onskip = () => {},
    }: Props = $props();

    const STEPS = {
        ios: ['INSTALL_IOS_1', 'INSTALL_IOS_2', 'INSTALL_IOS_3', 'INSTALL_IOS_4'],
        mac: ['INSTALL_MAC_1', 'INSTALL_MAC_2'],
    };
    const TEXT = 'text-sm-3 leading-sm-4 font-light text-white';
    const icn: Record<string, string> = icons();

    let target = $derived(deviceInstallTarget());
    let canInstall = $derived(target === 'prompt' && !install.done);
    let canSkip = $derived(gate && target !== 'ios');

    function skip() {
        pup?.toClose();
        onskip();
    }
</script>

<Popup bind:this={pup} bind:isShow onclose={onclose} title={$_('INSTALL_TITLE')}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            {#if pay}
                <p class={TEXT}>{$_('INSTALL_PAY')}</p>
            {:else if gate}
                <p class={TEXT}>{$_('INSTALL_GATE')}</p>
            {/if}

            {#if target === 'ios' || target === 'mac'}
                <ol class="flex flex-col gap-1.5 pl-5 list-decimal marker:text-fort-400 {TEXT}">
                    {#each STEPS[target] as step}
                        <li>
                            {#each stepParts($_(step, {values: {host: APP_HOST}})) as part, i}
                                {#if i % 2}<i class="inline-block h-4 w-4 align-text-bottom">{@html icn[part]}</i>{:else}{part}{/if}
                            {/each}
                        </li>
                    {/each}
                </ol>
            {:else if install.done}
                <p class={TEXT}>{$_('INSTALL_DONE')}</p>
            {/if}

            {#if canInstall}
                <button type="button"
                        class="w-full h-11 rounded-lg text-sm-4 overflow-hidden
                               {install.ready ? 'bg-cyan-400 text-fort-100' : 'bg-fort-300 text-fort-400'} ripple-container rpl-white"
                        disabled={!install.ready}
                        use:addRippleEffect
                        onclick={promptInstall}>
                    {$_('INSTALL_BTN')}
                </button>
            {/if}

            <button type="button"
                    class="w-full h-11 rounded-lg text-sm-4
                           {canInstall ? 'border border-fort-300 font-light text-white' : 'bg-cyan-400 text-fort-100'}"
                    onclick={canSkip ? skip : () => pup?.toClose()}>
                {$_(canSkip ? 'INSTALL_SKIP' : 'GOT_IT')}
            </button>
        </div>
    {/snippet}
</Popup>
