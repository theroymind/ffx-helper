import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles.css";
import "vue-sonner/style.css";

import App from "./App.vue";
import router from "./router";
import { useAnalytics } from "@/composables/useAnalytics";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const { initialize } = useAnalytics(app);
initialize();

app.mount("#app");
