<script lang="ts">
    import {toasts} from "../../core/store/toasts.svelte";
    import NoticeBar from "./notice-bar.svelte";
    import {fade} from "svelte/transition";
    import {flip} from "svelte/animate";
</script>

<div class="fixed top-0 inset-x-0 z-[10000] px-safe pt-safe pointer-events-none">
    <div class="w-full max-w-md mx-auto px-1 flex flex-col gap-1">
        {#each toasts.list as t (t.id)}
            <div class="rounded-r-lg bg-fort-100" out:fade={{duration: 300}} animate:flip={{duration: 300}}>
                <NoticeBar tone="cyan" title={t.title} text={t.body}/>
            </div>
        {/each}
    </div>
</div>
