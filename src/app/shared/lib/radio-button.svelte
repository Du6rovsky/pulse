<script lang="ts">
  import {ItemEntity} from "../../core/entities/item.entity";

  type Props = {
    item: ItemEntity;
    selectedId?: any;
    sub?: string;
    right?: import('svelte').Snippet;
    onclick?: (item: ItemEntity) => void;
  }

  let {
    item,
    selectedId = null,
    sub = '',
    right,
    onclick = () => {
    },
  }: Props = $props();

  let checked = $derived(selectedId != null && selectedId === item?.id);
</script>

<div class="w-full {sub ? 'min-h-6' : 'h-6 truncate'} flex justify-start items-center relative"
     onclick={() => onclick(item)}>
  <div class="w-5 h-5 rounded-full border-2 border-cyan-400 flex justify-center items-center absolute left-0">
    {#if checked}
      <div class="w-3 h-3 block rounded-full bg-cyan-400 border border-cyan-400"></div>
    {/if}
  </div>
  {#if sub}
    <span class="ml-7 grow min-w-0 flex flex-col">
      <span class="text-sm-3 leading-sm-4 text-white font-bold truncate">{item?.value}</span>
      <span class="text-sm leading-sm text-fort-400 font-light truncate">{sub}</span>
    </span>
  {:else}
    <span class="ml-6 text-white truncate text-base">{item?.value}</span>
  {/if}
  {@render right?.()}
</div>
