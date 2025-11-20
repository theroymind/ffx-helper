import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles.css";
import * as Sentry from "@sentry/vue";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

Sentry.init({
  app,
  dsn: "https://7d48942cbb25a8a75f40a3fcc9261e1c@o4510395206205440.ingest.us.sentry.io/4510395207057408",
  sendDefaultPii: true,
});

app.mount("#app");
