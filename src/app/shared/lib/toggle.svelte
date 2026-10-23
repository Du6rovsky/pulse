<script lang="ts">
    import {secureMathRandom, addRippleEffect} from "../../core/utils/toolbox.util";

    type Props = {
        value?: boolean;
        label?: string;
        labelledby?: string;
        onchange?: (value: boolean) => void;
    }

    let {
        value = $bindable(false),
        label = 'Default',
        labelledby,
        onchange = () => {},
    }: Props = $props();

    const id = secureMathRandom();

    function change(e) {
        value = e.target.checked;
        onchange(value);
    }
</script>

<div class="flex items-center justify-start mb-1">
  <label for="toggle-{id}" class="flex items-center cursor-pointer">
    <div use:addRippleEffect class="relative rounded-full overflow-hidden ripple-container rpl-white"
         style="min-width: 56px !important;">
      <input
          type="checkbox"
          id="toggle-{id}"
          class="sr-only"
          role="switch"
          aria-labelledby={labelledby}
          bind:checked={value}
          onchange={change}
      >
      <div class="block w-14 h-8 rounded-full shadow-sm
        {value ? 'bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400':'bg-gray-600'}">
      </div>
      <div class="dot absolute left-1 top-1 w-6 h-6 rounded-full transition {value ? 'bg-white':'bg-slate-800'}"></div>
    </div>
    <div class="ml-1 text-sm {value ? 'text-white':'text-slate-300'}">
      {label}
    </div>
  </label>
</div>

<style lang="scss">
  input:checked ~ .dot {
    transform: translateX(100%);
  }
</style>
