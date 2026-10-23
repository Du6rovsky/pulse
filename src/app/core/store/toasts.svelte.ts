export const toasts = $state({list: [] as {id: number; title: string; body: string}[]});

export const TOAST_MS = 5000;

let seq = 0;

export function showToast(title: string, body: string): void {
    if (!title) return;
    const id = ++seq;
    toasts.list.push({id, title, body});
    setTimeout(() => {
        toasts.list = toasts.list.filter(t => t.id !== id);
    }, TOAST_MS);
}
