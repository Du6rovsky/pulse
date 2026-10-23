<script lang="ts">
  import {debounce, generateUUID} from "../../core/utils/toolbox.util";
  import {fade} from "svelte/transition";
  import {onMount} from "svelte";

  type Props = {
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    alwaysShowResult?: boolean;
    isShowValue?: boolean;
    labels?: string[];
    ariaValuetext?: string;
    ariaLabelledby?: string;
    ariaLabel?: string;
    onchange?: (value: number) => void;
  }

  let {
    min = 1,
    max = 100,
    step = 1,
    value = $bindable(1),
    alwaysShowResult = false,
    isShowValue = true,
    labels = null,
    ariaValuetext = undefined,
    ariaLabelledby = undefined,
    ariaLabel = undefined,
    onchange = () => {
    },
  }: Props = $props();

  const uid = generateUUID();
  let showValue = $state(false);

  let valEl;

  const deb = debounce(() => {
    showValue = false;
  }, 500);

  function onChange(e) {
    value = Number(e.target.value);
    onchange(value);

    setValue();
    showHideValue();
  }

  function showHideValue() {
    if (isShowValue && !alwaysShowResult) {
      showValue = true;
      deb();
    }
  }

  function setValue() {
    if (!valEl) return;
    const newVal = Number((value - min) * 100 / (max - min));
    valEl.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }

  onMount(async () => {
    showValue = isShowValue && alwaysShowResult;
    valEl = document.getElementById(`val_${uid}`);
  })
</script>

<div class="w-full {labels ? '' : 'pr-7 pl-3'} h-6 relative flex items-center">
  <div class="w-full h-full relative flex items-center">
    <div class="range-value" id="val_{uid}">
      {#if showValue}
        <span transition:fade
              class="px-2 h-6 flex justify-center items-center text-center font-normal">
          {value}
        </span>
      {/if}
    </div>
    <input
        class="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        aria-valuetext={ariaValuetext}
        aria-labelledby={ariaLabelledby}
        aria-label={ariaLabel}
        oninput={onChange}
        value={value}>
    {#if !labels}
      <div class="min absolute -left-3 text-white text-base font-normal">
        {min}
      </div>
      <div class="max absolute -right-7 text-white text-base font-normal">
        {max}
      </div>
    {/if}
  </div>
</div>
{#if labels}
  <div class="num w-full flex justify-between text-xs-3 leading-xs-3 text-fort-400 font-light" aria-hidden="true">
    {#each labels as label}
      <span>{label}</span>
    {/each}
  </div>
{/if}

<style lang="scss">
  input[type=range] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    overflow: hidden;
    background: transparent;
    height: 20px;
  }

  input[type=range]:focus {
    outline: none;
  }

  input[type=range]::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #67e8f9, #f0abfc);
    border-radius: 5px;
    height: 2px;
  }

  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border-radius: 50%;
    height: 15px;
    width: 15px;
    margin-top: -6px;
    background: #fff;
    border: 1px solid rgba(19, 19, 19, 0.2);
  }

  input[type=range]::-moz-range-track {
    background: linear-gradient(to right, #67e8f9, #f0abfc);
    border-radius: 5px;
    height: 2px;
  }

  input[type=range]::-moz-range-thumb {
    box-sizing: border-box;
    border-radius: 50%;
    height: 15px;
    width: 15px;
    background: #fff;
    border: 1px solid rgba(19, 19, 19, 0.2);
  }

  .range-value {
    position: absolute;
    top: -24px;
  }

  .range-value span {
    text-align: center;
    background: #03a9f4;
    color: #fff;
    font-size: 12px;
    display: block;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    border-radius: 6px;
  }

  .range-value span:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 5px solid #03a9f4;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    margin-top: -1px;
  }
</style>
