import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const uni = require('@dcloudio/vite-plugin-uni').default as () => PluginOption

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
