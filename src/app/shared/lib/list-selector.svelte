<script lang="ts">
  import Popup from "./popup-tmpl.component.svelte";
  import RadioButton from "./radio-button.svelte";
  import {icons} from "../../assets/icons/icons";
  import {_} from "svelte-i18n";

  type Props = {
    lists?: any[];
    selectedId?: any;
    pup?: Popup;
    title?: string;
    subtitle?: string;
    instant?: boolean;
    badge?: import('svelte').Snippet<[any]>;
    onchange?: (data: {value: any, idx: number}) => void;
  }

  let {
    lists = [],
    selectedId = null,
    title = '',
    subtitle = '',
    instant = false,
    badge,
    onchange = () => {},
    pup = $bindable(null),
  }: Props = $props();

  const checkIcn = icons().check;

  let selectedStyleId: string = $state(null);
  let selectedItem: any = $state(null);
  let index;

  export function show() {
    selectedStyleId = selectedId;
  }

  export function close() {
    selectedItem = null;
  }

  function submit() {
    if (selectedItem && selectedItem?.id !== selectedId) {
      onchange({
        value: selectedItem,
        idx: index,
      });
    }
    pup?.toClose();
  }

  function check(e: any, idx: number) {
    selectedItem = e;
    index = idx;
    selectedStyleId = e?.id;
  }

  function pick(e: any, idx: number) {
    check(e, idx);
    submit();
  }
</script>

<Popup bind:this={pup} onshow={show} onclose={close} title={title} subtitle={subtitle}>
  {#snippet content()}
    {#if instant}
      <div class="w-full max-h-80 overflow-y-auto flex flex-col pb-2" role="radiogroup" aria-label={title}>
        {#each lists as list, idx}
          <button type="button"
                  role="radio"
                  aria-checked={list?.id === selectedId}
                  class="w-full h-10 px-2 flex flex-row justify-between items-center gap-2 rounded-md text-left
                         {list?.id === selectedId ? 'bg-fort-200' : ''}"
                  onclick={() => pick(list, idx)}>
            <span class="text-sm-3 leading-sm-4 text-white font-light truncate">
              {list?.value}{@render badge?.(list)}
            </span>
            {#if list?.id === selectedId}
              <span class="w-4 h-4 shrink-0 text-cyan-200" aria-hidden="true">{@html checkIcn}</span>
            {/if}
          </button>
        {/each}
      </div>
    {:else}
      <div class="w-full h-auto max-h-72 relative overflow-hidden shadow-sm pt-2">
        <div class="w-full h-auto max-h-60 overflow-y-auto grid grid-cols-1 divide-y divide-zinc-600">
          {#each lists as list, idx}
            <div class="w-full h-10 p-2 flex items-center
              {(list?.id === selectedStyleId) ? 'bg-fort-200' : ''}">
              <RadioButton
                      onclick={(e) => check(e, idx)}
                      item={list}
                      selectedId={selectedItem?.id || selectedId}
              />
            </div>
          {/each}
        </div>
        <div class="h-12 w-full p-2 px-4 flex justify-between border-t border-zinc-600">
          <button class="uppercase text-zinc-600 flex items-center"
                  onclick={pup?.toClose}>
            {$_('CANCEL')}
          </button>
          <button class="uppercase text-white flex items-center"
                  onclick={submit}>
            {$_('OK')}
          </button>
        </div>
      </div>
    {/if}
  {/snippet}
</Popup>
