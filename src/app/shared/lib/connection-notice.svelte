<script lang="ts">
    import {connection, openConnSheet} from "../../core/store/connection.svelte";
    import {connNotice} from "../../core/utils/connection-ui.util";
    import NoticeBar from "./notice-bar.svelte";
    import {_} from "../../core/utils/i18";

    type Props = {
        classes?: string;
    }

    let {classes = ''}: Props = $props();

    let n = $derived(connNotice(connection.state, connection.dataAt));
</script>

{#if n}
    <div class="w-full {classes}" role="status">
        <NoticeBar tone={n.tone}
                   title={$_(n.title)}
                   text={$_(n.text.key, {values: n.text.values})}
                   onclick={openConnSheet}/>
    </div>
{/if}
