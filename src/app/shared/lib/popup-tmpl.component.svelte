<svelte:options/>

<script module lang="ts">
  let openCount = 0;
</script>

<script lang="ts">
  import {onDestroy} from "svelte";
  import {clickOutside, generateUUID} from "../../core/utils/toolbox.util";
  import {icons} from "../../assets/icons/icons";
  import {fade, fly} from "svelte/transition";
  import {_} from "../../core/utils/i18";

  type Props = {
    is_closable?: boolean;
    is_locked?: boolean;
    isShowBack?: boolean;
    is_swipe_content?: boolean;
    isShow?: boolean;
    title?: string;
    subtitle?: string;
    content?: import('svelte').Snippet;
    onback?: () => void;
    onclose?: () => void;
    onshow?: (value: any) => void;
  }

  let {
    is_closable = true,
    is_locked = false,
    is_swipe_content = true,
    isShowBack = false,
    isShow = $bindable(false),
    title = '',
    subtitle = '',
    content,
    onback = () => {},
    onclose = () => {},
    onshow = () => {},
  }: Props = $props();


  const rangeToClose = 50;
  const uid = generateUUID();
  const closeIcn = icons().close;
  const backIcn = icons().back;

  let opener: HTMLElement | null = null;
  let holdsScroll = false;

  let content_element: HTMLElement = null;
  let isShowBuffer: boolean = $state(false);
  let element: HTMLElement = null;
  let heightElement: number = 0;
  let kHeigh: number = $state(0);
  let startY: number = 0;
  let deltaY: number = 0;
  let isAllowSwipe: boolean = true;
  let closable = $derived(is_closable && !is_locked);

  $effect(() => {
    checkVisible(isShow);
  });

  onDestroy(unlockScroll);

  function lockScroll() {
    if (holdsScroll) return;
    holdsScroll = true;
    openCount++;
    document.documentElement.classList.add('overflow-hidden');
  }

  function unlockScroll() {
    if (!holdsScroll) return;
    holdsScroll = false;
    if (--openCount === 0) document.documentElement.classList.remove('overflow-hidden');
  }

  export function toShow(_params?: any) {
    isShow = true;
    onshow(_params ?? null);
  }

  function onBack() {
    onback();
  }

  export function toClose() {
    isShow = false;
    onclose();
  }

  function onOutside() {
    if (closable) toClose();
  }

  function checkVisible(__isShow) {
    if (__isShow) {
      opener = document.activeElement as HTMLElement;
      lockScroll();

      const t = setTimeout(() => {
        if (!is_swipe_content) {
            content_element = document.getElementById(`popup_content_${uid}`) as HTMLElement;
            content_element.addEventListener("touchstart", () => {
                isAllowSwipe = false;
            });
            content_element.addEventListener("touchend", () => {
                isAllowSwipe = true;
            });
        }

        element = document.getElementById(`popup_${uid}`) as HTMLElement;

        if (!element.contains(document.activeElement)) {
          element.focus();
        }
        heightElement = element.offsetHeight;

        element.addEventListener("touchstart", handleStart);
        element.addEventListener("touchmove", handleMove);
        element.addEventListener("touchend", handleEnd);

        clearTimeout(t);
      })
    } else {
      unlockScroll();
      if (opener) {
        opener.focus?.();
        opener = null;
      }

      heightElement = 0;
      element = null;
      startY = 0;
      deltaY = 0;
    }
  }

  function handleStart(e) {
    startY = e.touches[0].clientY;
  }

  function handleMove(e) {
    if (closable && isAllowSwipe && isShow && e.touches[0].clientY > startY) {
      deltaY = Math.abs(e.touches[0].clientY - startY);

      if (element) {
        element.style.transform = `translateY(${deltaY}px)`;

        checkToHide();
      }
    }
  }

  function handleEnd(e) {
    if (closable && isAllowSwipe && element) {
      checkToHide();

      if (element && deltaY < rangeToClose) {
        element.style.transform = `translateY(0px)`;
        element.style.transition = '.3s ease-out';
      }
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (isShow && !is_locked && e.key === 'Escape') {
      toClose();
    }
  }

  function checkToHide() {
    if (element && deltaY > rangeToClose) {
      element.style.transform = `translateY(${heightElement}px)`;
      element.style.transition = '.3s ease-out';

      const t = setTimeout(() => {
        toClose();

        clearTimeout(t);
      }, 300)
    }
  }
</script>

<svelte:window onkeydown={onKeydown}/>

{#if isShow}
  <div
      in:fade={{duration: 100}}
      out:fade={{duration: 10}}
      class="absolute inset-0 flex justify-center items-center bg-fort-100/60"
      style="z-index: 9999 !important">
    <div
        id="popup_{uid}"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `popup_title_${uid}` : undefined}
        tabindex="-1"
        in:fly={{duration: 200, y: 2000}}
        out:fly={{duration: 10, y: 2000}}
        class="w-full max-w-md fixed bottom-0 left-0 right-0 mx-auto px-1 pt-2 bg-fort-100 border-t border-x border-fort-300 rounded-tl-xl rounded-tr-xl outline-none"
        use:clickOutside
        onclick_outside={onOutside}>
      <div class="h-2 w-full flex justify-center items-center relative">
        {#if is_closable}
          <div class="h-0.5 w-10 bg-white rounded-full"></div>
        {/if}
      </div>
      {#if title}
        <div class="flex flex-row justify-between items-start gap-2 px-1 pt-2 pb-3">
          {#if isShowBack}
            <button type="button"
                    class="flex items-center justify-center border border-fort-300 rounded-md w-7 h-7 shrink-0 p-1 text-fort-400 disabled:opacity-40"
                    aria-label={$_('BACK')}
                    disabled={is_locked}
                    onclick={onBack}>
              <i class="h-5 w-5">
                {@html backIcn}
              </i>
            </button>
          {/if}
          <div class="grow min-w-0 flex flex-col gap-0.5">
            <h2 id="popup_title_{uid}" class="text-md leading-md text-white font-light">{title}</h2>
            {#if subtitle}
              <span class="text-sm leading-sm text-fort-400 font-light">{subtitle}</span>
            {/if}
          </div>
          <button type="button"
                  class="flex items-center justify-center border border-fort-300 rounded-md w-7 h-7 shrink-0 p-1 text-fort-400 disabled:opacity-40"
                  aria-label={$_('CLOSE')}
                  disabled={is_locked}
                  onclick={toClose}>
            <i class="h-5 w-5">
              {@html closeIcn}
            </i>
          </button>
        </div>
      {/if}
      <div
          id="popup_content_{uid}"
          class="pb-safe">
        {@render content?.()}
      </div>
    </div>
  </div>
{/if}
