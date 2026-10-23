<script lang="ts">
    import {qrModules, qrPath, QR_MARGIN} from "../../core/utils/license.util";

    type Props = {
        text: string;
        label: string;
        classes?: string;
    }

    let {
        text,
        label,
        classes = 'w-26 h-26 rounded-md',
    }: Props = $props();

    let modules = $derived(text ? qrModules(text, 'Byte') : []);
    let size = $derived(modules.length + QR_MARGIN * 2);
</script>

<svg class="{classes} shrink-0" viewBox="0 0 {size} {size}" shape-rendering="crispEdges" role="img" aria-label={label}>
    <rect class="fill-white" width={size} height={size}/>
    <path class="fill-black" d={qrPath(modules)}/>
</svg>
