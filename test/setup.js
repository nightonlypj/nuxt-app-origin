import Vue from 'vue'
import Vuetify from 'vuetify'
import { config, RouterLinkStub } from '@vue/test-utils'
import locales from '~/locales/ja.js'

// Use Vuetify
Vue.use(Vuetify)

// Mock i18n
config.mocks = {
  $t: key => locales[key]
}

// Stub NuxtLink
config.stubs.NuxtLink = RouterLinkStub
