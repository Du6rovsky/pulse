<script lang="ts">
    import {addRippleEffect} from "../../core/utils/toolbox.util";

    type Props = {
        tone: 'red' | 'yellow' | 'cyan';
        title: string;
        text: string;
        action?: import('svelte').Snippet;
        onclick?: () => void;
    }

    let {tone, title, text, action, onclick}: Props = $props();

    const TONES = {
        red: {box: 'border-red-400 bg-red-400/10', title: 'text-red-200'},
        yellow: {box: 'border-yellow-400 bg-yellow-400/10', title: 'text-yellow-200'},
        cyan: {box: 'border-cyan-400 bg-cyan-400/10', title: 'text-cyan-200'},
    };
</script>

{#if onclick}
    <button type="button"
            class="w-full text-left flex flex-col gap-1 px-2 py-1.5 rounded-r-lg border-l-2 {TONES[tone].box}
                   overflow-hidden ripple-container rpl-white"
            aria-haspopup="dialog"
            use:addRippleEffect
            {onclick}>
        {@render body()}
    </button>
{:else}
    <div class="flex flex-col gap-1 px-2 py-1.5 rounded-r-lg border-l-2 {TONES[tone].box}" role="status">
        {@render body()}
    </div>
{/if}

{#snippet body()}
    <span class="text-sm-3 leading-sm-4 {TONES[tone].title}">{title}</span>
    <span class="text-sm leading-sm font-light text-fort-500">
        {text}
        {@render action?.()}
    </span>
{/snippet}
