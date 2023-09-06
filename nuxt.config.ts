import vuetify from 'vite-plugin-vuetify'
import { commonConfig } from './config/common'

const environment = process.env.NODE_ENV || 'development'
const config = require(`./config/${environment}.ts`)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: Object.assign(commonConfig, config.envConfig)
  },
  modules: [
    '@nuxtjs/i18n',
    '@sidebase/nuxt-auth',
    'nuxt-lodash'
  ],
  i18n: {
    vueI18n: './i18n.config.ts'
  },
  auth: {
    provider: {
      type: 'local'
    }
  },
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.css'
  ],
  build: {
    transpile: ['vuetify']
  },
  hooks: {
    'vite:extendConfig': (config) => {
      config.plugins!.push(vuetify())
    }
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    define: {
      'process.env.DEBUG': false
    }
  }
})
