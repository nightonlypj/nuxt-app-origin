import colors from 'vuetify/es5/util/colors'

const environment = process.env.NODE_ENV || 'development'
const config = require(`./config/${environment}.js`)

export default {
  publicRuntimeConfig: config,

  server: {
    port: 5000
  },

  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - nuxt-app-origin',
    title: 'nuxt-app-origin',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
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
    { src: '~/plugins/axios.js' }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
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
  axios: {},

  // Auth module configuration: https://auth.nuxtjs.org/
  auth: {
    redirect: {
      login: '/users/sign_in', // ログインURL
      logout: '/users/sign_in', // ログアウト後の遷移先URL
      callback: false,
      home: '/' // ログイン後の遷移先URL
    },
    strategies: {
      local: {
        token: {
          property: 'token',
          global: true
        },
        user: {
          property: 'user'
        },
        endpoints: {
          login: { url: config.authSignInURL, method: 'post' },
          logout: { url: config.authSignOutURL, method: 'delete' },
          user: { url: config.authUserURL, method: 'get' }
        }
      }
    }
  },

  // Toast module configuration: https://github.com/nuxt-community/community-modules/tree/master/packages/toast
  toast: {
    position: 'top-right',
    duration: 3000
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en'
    }
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
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
}
