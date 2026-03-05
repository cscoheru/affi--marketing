import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'vueRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/wrappers/DashboardWrapper.vue',
        './Experiments': './src/wrappers/ExperimentsWrapper.vue',
        './ExperimentDetail': './src/wrappers/ExperimentDetailWrapper.vue',
        './Plugins': './src/wrappers/PluginsWrapper.vue',
        './Analytics': './src/wrappers/AnalyticsWrapper.vue',
        './Settlements': './src/wrappers/SettlementsWrapper.vue',
      },
      shared: ['vue', 'pinia', 'element-plus'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,  // 从5173改为5174
    host: true,
    cors: true,
    origin: 'http://localhost:3000',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false,
  },
})
