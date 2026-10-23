import {FREE, PRO, type MeData} from "@shared";

export const me: MeData = $state({
    pro: false,
    paidUntil: null,
    plan: null,
    limits: {free: FREE, pro: PRO},
    prices: [],
    payMethods: [],
    vapidPublic: '',
});

export const pro = $state({pendingCreate: false, resumed: 0, restored: false});

export function setMe(d: MeData): void {
    Object.assign(me, d);
}
