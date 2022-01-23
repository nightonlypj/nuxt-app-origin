import Vue from 'vue'
import Vuetify from 'vuetify'
import { config, RouterLinkStub } from '@vue/test-utils'
import { TestPluginUtils } from '~/plugins/utils.js'
import locales from '~/locales/ja.js'

Vue.use(Vuetify)
Vue.use(TestPluginUtils)

// Mock i18n
config.mocks = {
  $t: (key) => {
    let locale = locales
    const parts = key.split('.')
    for (const part of parts) {
      locale = locale[part]
    }
    // eslint-disable-next-line no-throw-literal
    if (locale == null) { throw 'Not found: i18n(' + key + ')' }
    return locale
  }
}

// Stub NuxtLink
config.stubs.NuxtLink = RouterLinkStub

// Tips: v-dialogのwarn対応: [Vuetify] Unable to locate target [data-app]
const app = document.createElement('div')
app.setAttribute('data-app', true)
document.body.append(app)
