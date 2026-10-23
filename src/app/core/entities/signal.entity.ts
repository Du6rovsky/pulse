import {generateUUID} from "../utils/toolbox.util";
import {ItemEntity} from "./item.entity";

export const MAX_SPOTS = 3;
export const MAX_CONDITIONS = 4;

const h_ms = 60_000;
const h_m = 60;

export const PERIODS: Array<ItemEntity> = [
    {id: '5m', value: 5 * h_ms},
    {id: '15m', value: 15 * h_ms},
    {id: '30m', value: 30 * h_ms},
    {id: '45m', value: 40 * h_ms},
    {id: '1h', value: h_m * h_ms},
    {id: '3h', value: 3 * h_m * h_ms},
    {id: '6h', value: 6 * h_m * h_ms},
    {id: '24h', value: 24 * h_m * h_ms},
];

export class ConditionEntity {
    public id: string = generateUUID();
    public value: number = 5;
    public period: string = '1h';
}

export class SpotEntity {
    public id: string = generateUUID();
    public symbol: string = "BTC";
    public rate: number = 0;
    public percent: string = '';
    public conditions: ConditionEntity[] = [];
}

export class SignalEntity {
    public id: string = generateUUID();
    public is_repeat: boolean = false;
    public is_active: boolean = true;
    public blocks: SpotEntity[] = [new SpotEntity];
    public fired_count: number = 0;
    public fired_at: number = null;
    public created_at: number = Date.now();
}
