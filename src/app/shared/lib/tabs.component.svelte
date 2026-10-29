<script lang="ts">
    import {addRippleEffect} from "../../core/utils/toolbox.util";
    import {changeHash} from "../../core/utils/toolbox.util";
    import {ePages} from "../../core/entities/pages.enum";
    import {page$} from "../../core/store/app.store";
    import {connection, openConnSheet} from "../../core/store/connection.svelte";
    import {statusLine} from "../../core/utils/connection-ui.util";
    import {icons} from "../../assets/icons/icons";
    import {_} from "../../core/utils/i18";
    import {onMount} from "svelte";

    const buttons = [
        {
            label: "EXCHANGE",
            link: ePages.EXCHANGE,
            icon: icons().trend,
        },
        {
            label: "SIGNALS",
            link: ePages.SIGNALS,
            icon: icons().signal,
        },
        {
            label: "CONVERTER",
            link: ePages.CONVERTER,
            icon: icons().swap,
        }
    ];

    const SPIN = {red: 'border-red-400', yellow: 'border-yellow-400'};

    let page: string = $state('');
    let line = $derived(statusLine(connection.state));

    onMount(() => {
        page$.subscribe(page_ => {
            if (page_) {
                page = page_;
            }
        })
    })
</script>


<div class="max-w-104 flex items-center justify-center fixed inset-x-4 bottom-2.5 mb-safe-nav mx-auto z-1000">
    <div class="w-full flex flex-col bg-fort-100 bg-linear-to-b from-fort-200 to-fort-100 rounded-3xl border border-fort-300 overflow-hidden">
    {#if line}
        <button type="button"
                class="w-full h-5 flex flex-row items-center gap-2 px-4 border-b border-fort-300
                       text-xs-3 leading-xs-3 font-light text-fort-400 whitespace-nowrap overflow-hidden ripple-container rpl-white"
                aria-haspopup="dialog"
                aria-label="{$_(line.key)} {$_('CONN_MORE')}"
                use:addRippleEffect
                onclick={openConnSheet}>
            <span class="w-2.5 h-2.5 shrink-0 rounded-full border-[1.5px] border-r-transparent animate-spin motion-reduce:animate-none
                         {line.tone ? SPIN[line.tone] : 'border-fort-400'}"
                  aria-hidden="true"></span>
            <span class="truncate">{$_(line.key)}</span>
        </button>
    {/if}
    <div class="w-full h-11 grid grid-cols-3">
        {#each buttons as b, idx(b.link)}
            <button class="grow flex flex-col items-center min-w-20 px-2 py-1 text-white ripple-container rpl-white"
                    use:addRippleEffect
                    onclick={() => changeHash(b?.link)}>
                <i class="h-6 w-6
                    {page === b?.link ? 'text-white fill-white': 'text-slate-400 fill-slate-400'}">
                    {@html b?.icon}
                </i>
                <span class="text-sm leading-3 font-light
                      {page === b?.link ? 'text-white': 'text-slate-400'}">
                    {$_(b?.label)}
                </span>
            </button>
        {/each}
    </div>
    </div>
</div>