import {cubicOut} from "svelte/easing";

export function expand(
    node: Element | SVGPathElement,
    params: {
        duration: any;
        delay: any;
        easing: any;
    }){
    const {
        easing = cubicOut,
        duration = 400,
        delay = 0
    } = params;

    const w = parseFloat(getComputedStyle(node).strokeWidth);

    return {
        css: t => `opacity: ${t}; stroke-width: ${t * w}`,
        duration,
        easing,
        delay
    };
}
