import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import './assets/css/normalize.css';
import './assets/css/skeleton.css';

const app = createApp(App);

// Backend (funciones de Netlify). Se define con VITE_API_URL en .env
app.config.globalProperties.url =
  import.meta.env.VITE_API_URL || 'http://localhost:8888';

app.use(router).mount("#app");
