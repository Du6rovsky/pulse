import {deviceId$} from "../../core/store/app.store";
import {get} from "svelte/store";

export const SERVER_ORIGIN = import.meta.env.DEV ? "http://127.0.0.1:3000" : "https://impulse.inphinit.space";
export const APP_HOST = "pulse.inphinit.space";

export async function getToken() {
    const deviceId = get(deviceId$);

    return fetch(`${SERVER_ORIGIN}/session`, {
        headers: {
            Origin: window.location.origin,
            "x-device-id": deviceId,
        },
    });
}