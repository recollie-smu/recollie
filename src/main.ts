import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuestic } from "vuestic-ui";

import App from "./App.vue";
import router from "./router";
import { config } from "../vuestic.config.js";

import "./assets/main.css";
import "vuestic-ui/css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(createVuestic({ config }));

app.mount("#app");
