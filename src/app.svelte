<script lang="ts">
    import Splash from "./app/views/splash-screen/splash-screen.svelte";
    import {btcPrice$, rates$} from "./app/core/store/exchange.store";
    import {iosTab, startPwaFlow, watchInstall} from "./app/shared/services/pwa.service";
    import {restoreDraft, stripPayParam} from "./app/shared/services/pay.service";
    import {payInstallHint} from "./app/core/utils/install.util";
    import {readPending} from "./app/core/utils/pay.util";
    import PayPopups from "./app/shared/lib/pay.popups.svelte";
    import InstallPopup from "./app/shared/lib/install.popup.svelte";
    import AccessPopups from "./app/shared/lib/access.popups.svelte";
    import ConnectionPopup from "./app/shared/lib/connection.popup.svelte";
    import HitToasts from "./app/shared/lib/hit-toasts.svelte";
    import ConnectionDev from "./app/shared/lib/connection-dev.svelte";
    import {deviceId$, locale$} from "./app/core/store/app.store";
    import {loadDeviceId} from "./app/core/utils/toolbox.util";
    import RouterView from "./app/core/router/router.svelte";
    import {getWebSocket} from "./app/core/utils/ws.util";
    import {isLocaleLoaded} from "./app/core/utils/i18";
    import {routerGuard} from "./app/core/router/guard";
    import {locale as li18} from "svelte-i18n";
    import {onMount} from "svelte";

    let init: boolean = $state(false);
    let payInstall = $state(false);

    onMount(() => {
        startApp();
    })

    async function startApp() {
        watchInstall();
        const payId = stripPayParam();
        payInstall = payInstallHint(payId, iosTab(), readPending().map(p => p.paymentId));
        restoreDraft();
        await initApp();

        getWebSocket();
        startPwaFlow();
    }

    async function initApp() {
        deviceId$.set(loadDeviceId());

        const initT = setTimeout(async () => {
            init = true;
            routerGuard();
            clearTimeout(initT);

            btcWatcher();
        }, 1500);

        locale$.set('ru');
        li18.set('ru');
    }

    function btcWatcher() {
        rates$.subscribe((result) => {
            if (result && result['BTCUSDT']) {
                const btc = result['BTCUSDT']

                btcPrice$.set(JSON.parse(btc));
            }
        })
    }
</script>

<main>
    {#if init && $isLocaleLoaded}
        <RouterView/>
        <PayPopups/>
        <AccessPopups/>
        <ConnectionPopup/>
        <HitToasts/>
        <InstallPopup bind:isShow={payInstall} pay={true}/>
        {#if import.meta.env.DEV}
            <ConnectionDev/>
        {/if}
    {:else}
        <Splash/>
    {/if}
</main>