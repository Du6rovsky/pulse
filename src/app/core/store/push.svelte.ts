import type {PushPerm} from "../utils/push.util";

export const push: {perm: PushPerm, asked: boolean} = $state({perm: 'unsupported', asked: false});
