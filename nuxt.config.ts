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
  ],
  i18n: {
    vueI18n: './i18n.config.ts'
  }
})
