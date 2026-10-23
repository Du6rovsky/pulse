<script lang="ts">
    import {connection, connUi} from "../../core/store/connection.svelte";
    import {connSheet} from "../../core/utils/connection-ui.util";
    import Popup from "./popup-tmpl.component.svelte";
    import {me} from "../../core/store/me.svelte";
    import {_} from "../../core/utils/i18";

    const TONES = {red: 'text-red-200', yellow: 'text-yellow-200'};

    let sheet = $derived(connSheet(connection.state, connection.dataAt, me.pro));
</script>

<Popup bind:isShow={connUi.sheet} title={$_('CONNECTION')} subtitle={$_(sheet.sub)}>
    {#snippet content()}
        <div class="flex flex-col gap-3 px-1 pb-2">
            <dl class="flex flex-col px-2 border border-fort-300 rounded-lg divide-y divide-fort-300">
                {#each sheet.rows as r (r.label)}
                    <div class="flex flex-row justify-between gap-3 py-2 text-sm-3 leading-sm-4 font-light">
                        <dt class="text-fort-400">{$_(r.label)}</dt>
                        <dd class="text-right {r.tone ? TONES[r.tone] : 'text-white'}">{$_(r.value.key, {values: r.value.values})}</dd>
                    </div>
                {/each}
            </dl>

            <p class="text-xs-3 leading-xs-3 font-light text-fort-400">{$_('CONN_NOTE')}</p>
        </div>
    {/snippet}
</Popup>
