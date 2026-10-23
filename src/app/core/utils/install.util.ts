import {isIos} from "./push.util";

type InstallTarget = 'ios' | 'mac' | 'prompt' | null;

const MAC_SAFARI_MIN = 17;

function macSafariVersion(ua: string): number {
    if (!/Macintosh/.test(ua) || /Chrome|Chromium|Edg|OPR/.test(ua)) return 0;
    const m = /Version\/(\d+).*Safari\//.exec(ua);
    return m ? Number(m[1]) : 0;
}

function installTarget(ua: string, platform: string, maxTouchPoints: number, canPrompt: boolean): InstallTarget {
    if (isIos(ua, platform, maxTouchPoints)) return 'ios';
    if (platform === 'MacIntel' && macSafariVersion(ua) >= MAC_SAFARI_MIN) return 'mac';
    return canPrompt ? 'prompt' : null;
}

type GateState = {
    installed: boolean;
    canPrompt: boolean;
    done: boolean;
    hinted: boolean;
};

function installGate(ua: string, platform: string, maxTouchPoints: number, s: GateState): boolean {
    if (s.installed) return false;
    if (isIos(ua, platform, maxTouchPoints)) return true;
    return /Android/.test(ua) && (s.canPrompt || s.done) && !s.hinted;
}

function payInstallHint(payId: string | null, iosTab: boolean, pending: string[]): boolean {
    return payId !== null && iosTab && !pending.includes(payId);
}

function stepParts(text: string): string[] {
    return text.split(/\[(\w+)\]/);
}

export type {InstallTarget, GateState};

export {
    installTarget,
    installGate,
    payInstallHint,
    stepParts,
}
