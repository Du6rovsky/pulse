<script lang="ts">
    interface Props {
        direction?: number;
    }

    let {
        direction = 0,
    }: Props = $props();
</script>


<div class="flex flex-col gap-0.5">
    <div class="w-1.5 overflow-hidden inline-block">
        <div class="h-1 w-1 shadow-sm {direction > 0 ? 'bg-slate-300' : 'bg-slate-400'} rotate-45 transform origin-bottom-left"></div>
    </div>

    <div class="w-1.5 overflow-hidden inline-block">
        <div class="h-1 w-1 shadow-sm {direction < 0 ? 'bg-slate-300' : 'bg-slate-400'} -rotate-45 transform origin-top-left"></div>
    </div>
</div>