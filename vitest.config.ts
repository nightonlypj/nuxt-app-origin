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
    testTimeout: 10000, // NOTE: 5秒（デフォルト）だとタイムアウトする場合がある為
    // hookTimeout: 10000,
    // teardownTimeout: 10000,
    setupFiles: './test/setup.ts',
    globalSetup: './test/global-setup.ts'
  },
  plugins: [
    Vue({
      template: {
        compilerOptions: {
          // NOTE: Failed to resolve component
          isCustomElement: tag => ['NuxtLayout', 'NuxtPage', 'Head', 'Title', 'Meta', 'Link'].includes(tag)
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
            'defineNuxtPlugin',
            'definePageMeta'
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
