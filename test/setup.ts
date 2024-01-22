import { createI18n } from 'vue-i18n'
import { config, RouterLinkStub } from '@vue/test-utils'
import { vuetify } from '~/plugins/vuetify'
import helper from '~/test/helper'

// NOTE: 他のテストの影響を受けないようにする
afterEach(() => {
  vi.restoreAllMocks()
})

// Vuetify
global.ResizeObserver = require('resize-observer-polyfill')
config.global.plugins = [vuetify]

// Mock Config/i18n
const i18n = createI18n({
  locale: 'ja',
  messages: {
    ja: helper.locales
  }
})
config.global.mocks = {
  $config: { public: Object.assign(helper.envConfig, helper.commonConfig, { env: { production: false, test: true } }) },
  $t: (...args: any[]) => i18n.global.t(...args),
  $tm: (key: string) => i18n.global.tm(key)
}
vi.stubGlobal('useRuntimeConfig', vi.fn(() => config.global.mocks.$config))
vi.stubGlobal('useI18n', vi.fn(() => ({ t: config.global.mocks.$t, tm: config.global.mocks.$tm })))
vi.stubGlobal('useLocalePath', vi.fn(() => (url: string) => url))

// NOTE: Failed to resolve component: NuxtLink
config.global.stubs.NuxtLink = RouterLinkStub
