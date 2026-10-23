<script lang="ts">
    import {insets$, toHideHeaderContent$} from "../../core/store/app.store";
    import {onMount} from "svelte";

    interface Props {
        isShowHeader?: boolean;
        isShowFooter?: boolean;
        isShowHeaderContent?: boolean;
        isShowHeaderLabel?: boolean;
        isOverflowScroll?: boolean;
        isDraggable?: boolean;
        header_content?: import('svelte').Snippet;
        header_label?: import('svelte').Snippet;
        content?: import('svelte').Snippet;
        footer?: import('svelte').Snippet;
        bottomPosition?: number;
    }

    let {
        bottomPosition = 0,
        isShowHeader = true,
        isShowFooter = false,
        isShowHeaderLabel = $bindable(true),
        isShowHeaderContent = $bindable(false),
        isOverflowScroll = false,
        isDraggable = true,
        header_content,
        header_label,
        content,
        footer
    }: Props = $props();

    const rangeToClose = 30;
    const rangeToShow = 30;

    const availableTargets = [
        'P', 'SPAN', 'DIV'
    ];
    let isSwipeDown: boolean = $state(true);
    let heightElement: number = $state(0);
    let spawnPoint: number = $state(0);
    let startY: number = $state(0);
    let deltaY: number = $state(0);
    let element = $state(null);
    let insets = $state(null);

    onMount(async () => {
        if (isDraggable && isShowHeader) {
            initSlide();
        }

        insets$.subscribe((value) => {
            if (value !== null) {
                insets = value;
            }
        })
    })

    function initSlide() {
        const t = setTimeout(() => {
            element = document.getElementById('app_header') as HTMLElement;
            heightElement = element.offsetHeight;

            if (heightElement > 29) {
                spawnPoint = -heightElement + 28;

                if (!isShowHeaderContent) {
                    element.style.transform = `translateY(calc(-${heightElement}px + 1.75rem))`;
                }
            }

            element.addEventListener("touchstart", handleStart);
            element.addEventListener("touchmove", handleMove);
            element.addEventListener("touchend", handleEnd);

            toHideHeaderContent$.subscribe((value) => {
                if (isShowHeaderContent && value) {
                    slideOutHeader();

                    toHideHeaderContent$.set(false);
                }
            })

            clearTimeout(t);
        })
    }

    function handleStart(e) {
        if (availableTargets.includes(e?.target?.tagName)) {
            startY = e.touches[0].clientY;
        }
    }

    function handleMove(e) {
        if (isOverflowScroll) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (availableTargets.includes(e?.target?.tagName)) {
            isSwipeDown = e.touches[0].clientY > startY;

            deltaY = Math.abs(e.touches[0].clientY - (isSwipeDown ? startY : -startY));

            if (element) {
                if (!isShowHeaderContent && isSwipeDown) {
                    element.style.transform = `translateY(${spawnPoint + deltaY}px)`;

                    checkToShow();
                } else if (isShowHeaderContent && !isSwipeDown) {
                    element.style.transform = `translateY(-${deltaY}px)`;

                    checkToHide();
                }
            }

            toHideHeaderContent$.set(false);
        }
    }

    function handleEnd(e) {
        if (element && availableTargets.includes(e?.target?.tagName)) {
            if (!isShowHeaderContent && isSwipeDown) {
                checkToShow();

                if (element && deltaY < rangeToShow) {
                    slideOutHeader();
                }
            } else if (isShowHeaderContent && !isSwipeDown) {
                checkToHide();

                if (element && deltaY < rangeToClose) {
                    slideInHeader();
                }
            }
        }
    }

    function checkToShow() {
        if (element && deltaY > rangeToShow) {
            slideInHeader();
        }
    }

    function checkToHide() {
        if (element && deltaY > rangeToClose) {
            slideOutHeader();
        }
    }

    function slideInHeader() {
        element.style.transform = `translateY(${spawnPoint - spawnPoint}px)`;
        element.style.transition = '.3s ease-in';

        isShowHeaderContent = true;
    }

    function slideOutHeader() {
        element.style.transform = `translateY(calc(-${heightElement}px + 2.5rem))`;
        element.style.transition = '.3s ease-out';

        isShowHeaderContent = false;
    }
</script>

<div class="w-full h-full bg-fort-100 bg-linear-to-b from-fort-100 to-fort-200 fixed top-0"></div>

<div class="main-tmpl absolute inset-0 px-safe pt-safe flex flex-col items-center overflow-hidden" id="main-tmpl">
    <div class="grow w-full z-10 {isOverflowScroll ? 'overflow-auto' : 'overflow-hidden'} overscroll-y-none
                no-scrollbar pb-safe mb-safe-nav max-w-md">

        {#if isShowHeader}
            <div class="sticky top-0"
                 style="z-index: 999 !important">
                <div class="w-full min-h-7 max-w-md flex flex-col gap-2 items-center justify-center absolute
                            top-0 z-30 px-1 m-auto left-0 right-0 bg-fort-100">

                    <div class="w-full">
                        {@render header_content?.()}
                    </div>
                </div>
            </div>
        {/if}

        <div class="w-full h-full {isOverflowScroll ? 'pb-16' : ''} px-1 relative"
             style="z-index: 0 !important;">
            {@render content?.()}
        </div>
    </div>

    {#if isShowFooter}
        <div class="flex-none w-full max-w-md flex items-center justify-center z-20 pt-2 min-h-16
                 {bottomPosition === 0 ? 'sticky pb-safe' : 'absolute pb-2 mb-safe-nav'}"
             style="bottom: {bottomPosition}px !important;">
            {@render footer?.()}
        </div>
    {/if}
</div>
