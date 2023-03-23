import { createApp } from "vue";
import { createPinia } from "pinia";
import {
  createVuesticEssential,
  VaButton,
  VaButtonGroup,
  VaImage,
  VaIcon,
  VaList,
  VaListLabel,
  VaListItem,
} from "vuestic-ui";

import App from "./App.vue";
import router from "./router";
import { config } from "../vuestic.config.js";

import "./assets/main.css";
import "vuestic-ui/css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(
  createVuesticEssential({
    components: {
      VaButton,
      VaButtonGroup,
      VaImage,
      VaIcon,
      VaList,
      VaListLabel,
      VaListItem,
    },
    config,
  })
);

app.mount("#app");
