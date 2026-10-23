<script lang="ts">
    import {devConnection} from "../../core/store/connection.svelte";
    import type {ConnState} from "../../core/utils/connection.util";

    const STATES: ConnState[] = ['ok', 'connecting', 'offline', 'server', 'stale', 'sync'];

    function onChange(e: Event) {
        const v = (e.currentTarget as HTMLSelectElement).value;
        devConnection(v ? v as ConnState : null);
    }
</script>

<select class="fixed top-1 right-1 z-10000 h-6 px-1 rounded-md bg-fort-300 text-xs-3 text-white"
        aria-label="dev: состояние сети"
        onchange={onChange}>
    <option value="">live</option>
    {#each STATES as s (s)}
        <option value={s}>{s}</option>
    {/each}
</select>
