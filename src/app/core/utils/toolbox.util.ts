import {MINUS} from "@shared";

function generateUUID(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    if (window.crypto && "getRandomValues" in window.crypto) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
        return (
            hex.slice(0, 8) + "-" +
            hex.slice(8, 12) + "-" +
            hex.slice(12, 16) + "-" +
            hex.slice(16, 20) + "-" +
            hex.slice(20)
        );
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const DEVICE_KEY = 'device.id';

function loadDeviceId(): string {
    try {
        const saved = localStorage.getItem(DEVICE_KEY);
        if (saved) return saved;
        const id = generateUUID();
        localStorage.setItem(DEVICE_KEY, id);
        return id;
    } catch {
        return generateUUID();
    }
}

function inputPattern(event) {
    const regex = /^[0-9.]*$/;
    const key = String.fromCharCode(!event.charCode ? event.which : event.charCode);

    if (!regex.test(key)) {
        event.preventDefault();
        return false;
    }
}

function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomNumbersArray(
    from: number,
    to: number,
    amount: number,
    duplicates: boolean) {
    const result: number[] = [];

    for (let i = 0; i < amount; i++) {
        const randomNumber = getRandomIntInclusive(from, to);
        if (!duplicates && result.includes(randomNumber)) {
            --i;
        } else {
            result.push(randomNumber);
        }
    }

    return result;
}

function createGroups(arr, numGroups) {
    const perGroup = Math.ceil(arr.length / numGroups);
    const newArr = [];

    for (let i = 0; i < numGroups; i++) {
        const list = arr.slice(i * perGroup, (i + 1) * perGroup);

        if (list.length > 0) {
            newArr.push(list);
        } else {
            break;
        }
    }
    return newArr;
}

function shuffleList(items: any[]) {
    const itemsCopy = JSON.parse(JSON.stringify(items));
    return itemsCopy.sort(() => Math.random() - 0.5);
}

function counter(i: number) {
    return new Array(i);
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function randArrItem(items: any[]) {
    return items[Math.floor(Math.random() * items.length)];
}

function random(a, b) {
    return Math.random() * (b - a) + a;
}

function rippleEffect(event) {
    const btn = event.currentTarget;
    const size = btn.offsetWidth;
    const pos = btn.getBoundingClientRect();
    const circle = document.createElement("span");
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);

    let colorIdx = btn.classList.length - 1;

    if ((btn.classList[colorIdx - 1]).includes('rpl')) {
        colorIdx = colorIdx - 1;
    }

    const color = (btn.classList[colorIdx]).replace('rpl', 'bg');

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.pageX - pos.left - size / 2}px`;
    circle.style.top = `${event.pageY - pos.top - size / 2}px`;
    circle.classList.add("ripple");
    circle.classList.add(color);

    btn.appendChild(circle);

    const t = setTimeout(() => {
        const ripple = btn.getElementsByClassName("ripple")[0];

        if (ripple) {
            ripple.remove();
        }

        clearTimeout(t);
    }, 500)
}

function addRippleEffect(node) {
    node.addEventListener("click", rippleEffect);
}

function debounce(func: { (): void; (): void; (): void; apply?: any; }, delay: number) {
    let inDebounce: number;

    return function () {
        let args = arguments;
        let context = this;

        clearTimeout(inDebounce);
        return (inDebounce = setTimeout(() => {
            return func.apply(context, args);
        }, delay));
    };
}

function secureMathRandom() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] / (Math.pow(2, 32) - 1);
}

function getBack() {
    const toHome = ['#wheel', '#drawing', '#shuffle'];
    const page = document.location.hash;
    if (toHome.includes(page)) {
        document.location.hash = '#home';
    } else {
        history.back();
    }
}

function clickOutside(node) {
    const handleClick = (event) => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(new CustomEvent('click_outside'));
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    }
}

function changeHash(hash: string): void {
    document.location.hash = hash;
}

async function openLink (url:string) {
    window.open(url, '_system', 'location=yes');
}

function resizeText(el, step = 1) {
    const minSize = 10, maxSize = 100, unit = 'px';
    const isOverflownVertical = ({ clientHeight, scrollHeight }) => scrollHeight > clientHeight;
    const isOverflownHorizontal = ({ clientWidth, scrollWidth }) => scrollWidth > clientWidth;

    let i = minSize;
    let overflowVertical = false;
    let overflowHorizontal = false;

    const parent = el.parentNode;

    while (!overflowVertical && !overflowHorizontal && i < maxSize) {
        el.style.fontSize = `${i}${unit}`;
        overflowVertical = isOverflownVertical(parent);
        overflowHorizontal = isOverflownHorizontal(parent);

        if (!overflowVertical && !overflowHorizontal) i += step;
    }

    el.style.fontSize = `${i - step}${unit}`;
}

const throttle = (func: Function, timeFrame: number) => {
    let lastTime: number = 0;
    return (...args: any) => {
        const now = new Date()
        if (Number(now) - Number(lastTime) >= timeFrame) {
            func(...args)
            lastTime = Number(now);
        }
    }
}

const throttledResize = throttle(resizeText, 25);

function sortingArray(items: Array<any>, prop: string, direction: string) {
    if (items?.length > 0) {
        if (Number.isNaN(+(items[0][prop]))) {
            items.sort((a, b) => {
                const a_ = a[prop].toUpperCase();
                const b_ = b[prop].toUpperCase();

                return direction === 'asc' ? a_.localeCompare(b_, undefined, { numeric: true, sensitivity: 'base' }) :
                    b_.localeCompare(a_, undefined, { numeric: true, sensitivity: 'base' });
            })
        } else {
            items.sort((a, b) => (direction === 'asc' ? (+a[prop]) - (+b[prop]) : (+b[prop]) - (+a[prop])));
        }
    }
}

function getLabel(value: string) {
    return value.replace("USDT", "");
}

function getPercentStyle(value: string) {
    const percent = +value * 100;
    const abs = Math.abs(percent);

    if (abs === 0) {
        return 'bg-fort-300 text-fort-500';
    }

    if (percent > 0) {
        if (abs < 0.5) return 'bg-green-500/10 text-green-400';
        if (abs < 3) return 'bg-green-400/20 text-green-300';
        if (abs < 10) return 'bg-green-400/35 text-green-200';
        return 'bg-green-300 text-green-950';
    }

    if (abs < 3) return 'bg-error-250/20 text-error-250';
    if (abs < 10) return 'bg-error-250/35 text-red-200';
    return 'bg-error text-white';
}


function getPercent24(value: string) {
    const percent = roundTo((+value * 100), 2);
    const sym = percent >= 0 ? '+' : MINUS;
    return sym + Math.abs(percent) + '%';
}

function getTurnOver(value: string) {
    const to =  value.split(".")[0];
    let filteredValue = to;
    let sub = '';

    if (to?.length > 9) {
        filteredValue = to.slice(0, -6);
        sub = 'B';
    } else if (to?.length <=9  && to?.length > 6) {
        filteredValue = to.slice(0, -3);
        sub = 'M';
    } else if (to?.length <= 6 && to?.length > 3) {
        sub = 'K';
    }

    const res = +(filteredValue.slice(0, -3) + '.' + filteredValue.slice(-3));

    return roundTo(res, 2) + ' ' + sub;
}

function roundTo(num: number, precision: number) {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
}

export {
    getRandomIntInclusive,
    getRandomNumbersArray,
    secureMathRandom,
    addRippleEffect,
    throttledResize,
    getPercentStyle,
    getRandomColor,
    inputPattern,
    getPercent24,
    getTurnOver,
    generateUUID,
    loadDeviceId,
    clickOutside,
    createGroups,
    sortingArray,
    randArrItem,
    shuffleList,
    resizeText,
    changeHash,
    openLink,
    debounce,
    getLabel,
    roundTo,
    getBack,
    counter,
    random,
};

