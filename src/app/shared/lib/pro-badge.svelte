<script lang="ts">
    type Props = {
        classes?: string;
    }

    let {
        classes = 'bg-cyan-400/15 text-cyan-200',
    }: Props = $props();
</script>

<span class="inline-block ml-1 px-1 rounded-sm text-xs-2 font-bold leading-sm tracking-wide {classes}">PRO</span>
