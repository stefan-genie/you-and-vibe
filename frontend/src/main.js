import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./styles.css";
import { useProgressStore } from "./stores/progress.js";
import { persist } from "./utils/persist.js";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

persist(useProgressStore(), "vibe-progress");

app.mount("#app");
