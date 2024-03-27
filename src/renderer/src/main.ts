import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primeflex/primeflex.css'

import store from "./store"
import router from "./router/router"

const app = createApp(App);

app.use(PrimeVue)
app.use(store)
app.use(router)
app.mount('#app')
