import App from "./app.svelte";
import {mount} from "svelte";
import "./app.css";

const app = mount(App, {
    target: document.getElementById("app"),
    intro: false
});

export default app;
