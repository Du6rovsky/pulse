import {_, init, locale, register} from "svelte-i18n";
import {locale$ as i18} from "../store/app.store";
import {derived} from "svelte/store";

register('ru', () => import('../../assets/i18n/ru.json'));

let localeValue = 'ru';
const list = ['ru'];
const LOCALE_KEY = 'locale';

function savedLocale(): string | null {
    try {
        return localStorage.getItem(LOCALE_KEY);
    } catch {
        return null;
    }
}

function getLanguageCode() {
    const code = navigator.language;


    const loc = code.substring(0, 2);
    const id = savedLocale();

    if (id) {
        localeValue = id;
    } else if (list.includes(loc)) {
        localeValue = loc;
    }

    init({
        fallbackLocale: 'en',
        initialLocale: localeValue,
    });

    locale.set(localeValue);
    setI18(localeValue)
}

function setI18(value: string) {
    i18.set(value);
}

function storeLocale(id: string) {
    try {
        localStorage.setItem(LOCALE_KEY, id);
    } catch {
    }
}

function selectLocale(event: {value?: any}) {
    localeValue = event?.value.id;
    locale.set(localeValue);
    setI18(localeValue);
    storeLocale(localeValue)
}

const isLocaleLoaded = derived(locale, $locale => typeof $locale === 'string');

getLanguageCode();

export {_, isLocaleLoaded, selectLocale};
