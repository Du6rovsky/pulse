<script lang="ts">
  import {expand} from "../../core/utils/custom-transition.util";
  import {draw, fade, fly} from 'svelte/transition';
  import {quintOut} from "svelte/easing";
  import {onMount} from "svelte";

  const label = "PULSE";
  const sub = "by INPHINIT";

  let showTemplate: boolean = $state(false);

  onMount(async () => {
    const init = setTimeout(async () => {
      showTemplate = true;
      clearTimeout(init);
    })
  })
</script>

<div class="absolute inset-0">
  {#if showTemplate}
    <div class="w-48 h-48 fixed self-center origin-center inset-0 m-auto">
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 500 500">
        <g out:fade="{{duration: 200}}" transform="matrix(5 0 0 5 250 250)">
          <path in:draw|global="{{duration: 500}}"
                style="fill: none; stroke: #5FB3B9; stroke-width: 0.4; stroke-linecap: round;"
                d="M -45 0 H 45"
          />

          <path in:expand|global="{{duration: 500, delay: 500, easing: quintOut}}"
                style="fill: none; stroke: #5FB3B9; stroke-width: 5; stroke-linecap: round;"
                d="M -45 0 H 45"
          />
        </g>

        <g out:fade="{{duration: 200}}" transform="matrix(5 0 0 5 250 250)" style="opacity: 0.55;">
          <path in:draw|global="{{duration: 500}}"
                style="fill: none; stroke: #A8F7FA; stroke-width: 0.4;"
                d="M 0 -17 C 9.384 -17 17 -9.384 17 0 C 17 9.384 9.384 17 0 17 C -9.384 17 -17 9.384 -17 0 C -17 -9.384 -9.384 -17 0 -17 z"
          />

          <path in:expand|global="{{duration: 500, delay: 500, easing: quintOut}}"
                style="fill: none; stroke: #A8F7FA; stroke-width: 3.4;"
                d="M 0 -17 C 9.384 -17 17 -9.384 17 0 C 17 9.384 9.384 17 0 17 C -9.384 17 -17 9.384 -17 0 C -17 -9.384 -9.384 -17 0 -17 z"
          />
        </g>

        <g out:fade="{{duration: 200}}" transform="matrix(5 0 0 5 250 250)" style="opacity: 0.22;">
          <path in:draw|global="{{duration: 500}}"
                style="fill: none; stroke: #A8F7FA; stroke-width: 0.4;"
                d="M 0 -28 C 15.456 -28 28 -15.456 28 0 C 28 15.456 15.456 28 0 28 C -15.456 28 -28 15.456 -28 0 C -28 -15.456 -15.456 -28 0 -28 z"
          />

          <path in:expand|global="{{duration: 500, delay: 500, easing: quintOut}}"
                style="fill: none; stroke: #A8F7FA; stroke-width: 2.6;"
                d="M 0 -28 C 15.456 -28 28 -15.456 28 0 C 28 15.456 15.456 28 0 28 C -15.456 28 -28 15.456 -28 0 C -28 -15.456 -15.456 -28 0 -28 z"
          />
        </g>

        <g out:fade="{{duration: 200}}" transform="matrix(5 0 0 5 250 250)">
          <path in:draw|global="{{duration: 500}}"
                style="fill: none; stroke: #A8F7FA; stroke-width: 0.4;"
                d="M 0 -9 C 4.968 -9 9 -4.968 9 0 C 9 4.968 4.968 9 0 9 C -4.968 9 -9 4.968 -9 0 C -9 -4.968 -4.968 -9 0 -9 z"
          />

          <path in:expand|global="{{duration: 500, delay: 500, easing: quintOut}}"
                style="fill: #A8F7FA;"
                d="M 0 -9 C 4.968 -9 9 -4.968 9 0 C 9 4.968 4.968 9 0 9 C -4.968 9 -9 4.968 -9 0 C -9 -4.968 -4.968 -9 0 -9 z"
          />
        </g>
      </svg>

      <div class="centered truncate flex flex-col" out:fly="{{y: -40, duration: 500}}">
        <div class="text-center">
          {#each label as char, i}
                        <span class="text-2xl text-cyan-400 font-sans"
                              in:fade|global="{{delay: i * 50, duration: 500}}">{char}</span>
          {/each}
        </div>

        <div class="text-center">
          {#each sub as char, i}
                        <span class="text-md text-white font-sans"
                              in:fade|global="{{delay: i * 50, duration: 500}}">{char}</span>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  path {
    fill: rgb(31 41 55);
    opacity: 1;
  }

  .centered {
    position: absolute;
    left: 50%;
    top: 120%;
    transform: translate(-50%, -50%);
    letter-spacing: 0.12em;
    font-weight: 400;
  }

  .centered span {
    will-change: filter;
  }
</style>
