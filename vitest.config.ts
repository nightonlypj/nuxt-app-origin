import path from 'path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    server: {
      deps: {
        inline: ['vuetify']
      }
    },
    testTimeout: 30000, // NOTE: 5秒（デフォルト）だとタイムアウトする場合がある為
    hookTimeout: 30000,
    teardownTimeout: 30000,
    setupFiles: ['./test/setup.ts']
  },
  plugins: [
    Vue({
      template: {
        compilerOptions: {
          // NOTE: Failed to resolve component
          isCustomElement: tag => ['NuxtLayout', 'NuxtPage', 'Head', 'Title', 'Meta'].includes(tag)
        }
      }
    }),
    AutoImport({
      imports: [
        // presets
        'vue',
        // 'vue-router', // NOTE: useRouteのstubGlobalがundefinedになる為
        // custom
        {
          '#app': [
            'defineNuxtComponent',
            'defineNuxtPlugin'
          ]
        }
      ],
      dts: false // NOTE: ./auto-imports.d.tsを出力しない
    })
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '#app': path.resolve(__dirname, 'test/nuxt.app.ts')
    }
  }
})
