import { defineNuxtConfig } from '@nuxt/bridge'
import colors from 'vuetify/es5/util/colors'

const environment = process.env.NODE_ENV || 'development'
const envConfig = require(`./config/${environment}.js`)
// eslint-disable-next-line nuxt/no-cjs-in-config
const commonConfig = require('./config/common.js')

export default defineNuxtConfig({
  publicRuntimeConfig: Object.assign(envConfig, commonConfig),

  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/axios.js' },
    { src: '~/plugins/utils.js' }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: false, // NOTE: Jestでは明示的にimportする必要がある為、揃えておく

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/toast',
    '@nuxtjs/pwa'
  ],

  // I18n module configuration: https://i18n.nuxtjs.org/
  i18n: {
    locales: [
      { code: 'ja', iso: 'ja', file: 'ja.js' }
    ],
    defaultLocale: 'ja',
    lazy: true,
    langDir: 'locales/'
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    debug: envConfig.debug
  },

  // Auth module configuration: https://auth.nuxtjs.org/
  auth: {
    redirect: {
      login: commonConfig.authRedirectSignInURL, // ログインURL
      logout: commonConfig.authRedirectLogOutURL, // ログアウト後の遷移先URL
      callback: false,
      home: commonConfig.authRedirectHomeURL // ログイン後の遷移先URL
    },
    strategies: {
      local: {
        token: {
          property: 'token',
          global: true,
          maxAge: 60 * 60 * 24 // バックエンドと同じか長くしないと不整合な状態になる（フロントが未ログイン、バックエンドがログイン中）
        },
        user: {
          property: 'user'
        },
        endpoints: {
          login: { url: envConfig.apiBaseURL + commonConfig.authSignInURL, method: 'post' },
          logout: { url: envConfig.apiBaseURL + commonConfig.authSignOutURL, method: 'post' },
          user: { url: envConfig.apiBaseURL + commonConfig.authUserURL, method: 'get' }
        }
      }
    }
  },

  // Toast module configuration: https://github.com/nuxt-community/community-modules/tree/master/packages/toast
  toast: {
    position: 'bottom-right',
    duration: 3000
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'ja'
    }
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2, // <- blue
          secondary: colors.grey.darken3, // <- amber.darken3 <- grey.darken3
          accent: colors.amber.darken3, // <- grey.darken3 <- pink.accent2
          info: colors.teal.lighten1, // <- blue
          warning: colors.amber.base, // <- orange.darken1
          error: colors.deepOrange.accent4, // <- red.accent2
          success: colors.green.accent3 // <- green
        },
        light: {
          // primary: colors.blue.darken2,
          // secondary: colors.grey.darken3,
          // accent: colors.blue.accent1,
          // info: colors.blue,
          // warning: colors.orange.darken1,
          // error: colors.red.accent2,
          // success: colors.green
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    babel: {
      plugins: [
        ['@babel/plugin-proposal-private-methods', { loose: true }]
      ]
    }
  }
})
