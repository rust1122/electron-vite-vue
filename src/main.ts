import { createApp } from 'vue'
import App from './App.vue'
import { router } from '@/router/index'
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

import './style.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
        preset: Aura
    }
  })
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
