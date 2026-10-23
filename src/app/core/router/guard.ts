import {changeHash} from "../utils/toolbox.util";
import {ePages} from "../entities/pages.enum";
import {defaultPage} from "./routes";

const validRoutes = Object.values(ePages);

function routerGuard() {
    const page = document.location.hash as ePages;

    if (window.location.pathname !== '/') {
        history.pushState({}, null, '/');
    }

    if (!page || !validRoutes.includes(page)) {
        changeHash(defaultPage);
    }
}

export {
    routerGuard
};
