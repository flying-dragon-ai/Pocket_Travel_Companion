import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/index.scss'

export function createApp() {
  // uni-app Vue3 初始化入口：挂载 Pinia 以支撑全局状态管理。
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  return {
    app,
    pinia
  }
}
