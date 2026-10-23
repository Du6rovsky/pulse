<script lang="ts">
    import {isShowNav$, page$, prevPage$, toHideHeaderContent$} from "../store/app.store";
    import {ePages} from "../entities/pages.enum";
    import {defaultPage, routes} from "./routes";
    import {routerGuard} from "./guard";
    import {onMount} from "svelte";

    const tabs = import("../../shared/lib/tabs.component.svelte");

    let page: ePages = $state(defaultPage);
    let view: Promise<any> = $derived(routes[page]);
    let isShowNav = $state(true);

    $effect(() => {
        page = document.location.hash as ePages;

        page$.set(page);
    })

    onMount(async () => {
        window.onpopstate = function () {
            if (page !== document.location.hash as ePages) {
                toHideHeaderContent$.set(false);
                prevPage$.set(page);
                page = document.location.hash as ePages;
                window.scrollTo(0, 0);
            }

            routerGuard();
        };

        isShowNav$.subscribe((value) => {
            isShowNav = value
        })
    })
</script>

{#await view then {default: View}}
    <View/>
{/await}

{#if isShowNav}
    {#await tabs then {default: Tabs}}
        <Tabs/>
    {/await}
{/if}
