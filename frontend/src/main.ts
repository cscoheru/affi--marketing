import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import './styles/theme.css'
import App from './App.vue'
import router from './router'
import { useBridgeStore } from './stores/bridge'

const app = createApp(App)
const pinia = createPinia()

// Register Pinia store (must be before other plugins that might use stores)
app.use(pinia)

// Register Element Plus
app.use(ElementPlus)
app.use(router)

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Mount the app
app.mount('#app')

// Initialize Bridge Store after app mount (when DOM is available)
const bridgeStore = useBridgeStore()

// Initialize the bridge store on app startup
bridgeStore.hydrate()
bridgeStore.setupReactListener()
