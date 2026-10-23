const ICON = '/icon-192.png';
const TAG = 'pulse';

export type PushNotice = {
    title: string;
    options: NotificationOptions & {renotify: boolean};
};

export function notification(text: string | null): PushNotice {
    let data: Record<string, unknown> | null = null;
    try {
        const v: unknown = text ? JSON.parse(text) : null;
        if (v && typeof v === 'object') data = v as Record<string, unknown>;
    } catch {
    }

    const ok = !!data?.title;
    const {title, body, signalId, url} = ok ? data : {} as Record<string, unknown>;

    return {
        title: ok ? String(title) : 'Pulse',
        options: {
            body: ok && body != null ? String(body) : '',
            tag: ok && signalId ? String(signalId) : TAG,
            renotify: true,
            icon: ICON,
            badge: ICON,
            data: {url: ok && typeof url === 'string' && url ? url : '/signals'},
        },
    };
}
