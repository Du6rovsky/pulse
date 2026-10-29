<script lang="ts">
  import {addRippleEffect} from "../../core/utils/toolbox.util";
  import {icons} from "../../assets/icons/icons";

  type Props = {
    isShowError?: boolean;
    value?: boolean;
    classes?: string;
    item?: import('svelte').Snippet;
    onclick?: (value: boolean) => void;
    checkClasses?: string;
    isFull?: boolean;
  }

  let {
    isShowError = false,
    isFull = true,
    value = $bindable(false),
    classes = 'items-start',
    checkClasses = 'w-7 h-7',
    item,
    onclick = () => {},
  }: Props = $props();

  const checkIcn = icons().check;

  function onClick() {
    value = !value;

    const t = setTimeout(() => {
      onclick(value);
      clearTimeout(t);
    })
  }
</script>

<button type="button"
        role="checkbox"
        aria-checked={value}
        class="{isFull ? 'w-full' : ''} flex flex-row {classes} rounded-md overflow-hidden ripple-container rpl-white"
        use:addRippleEffect
        onclick={onClick}>
  <div class="flex-none mr-2">
    <div class="{checkClasses} rounded-md {!value ? 'border ' + (isShowError ? 'border-error-250' : 'border-neutral-500') : ''}
              flex justify-center items-center text-white {value ? 'bg-secondary': ''}">
      {#if value}
        <span class="w-full h-full p-1" aria-hidden="true">{@html checkIcn}</span>
      {/if}
    </div>
  </div>
  {@render item?.()}
</button>
