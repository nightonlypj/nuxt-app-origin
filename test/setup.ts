import { config, RouterLinkStub } from '@vue/test-utils'
import { vuetify } from '~/plugins/vuetify'
import helper from '~/test/helper'
import { TestPluginUtils } from '~/plugins/utils'

// NOTE: 他のテストの影響を受けないようにする
afterEach(() => {
  vi.restoreAllMocks()
})

// Vuetify
global.ResizeObserver = require('resize-observer-polyfill')
config.global.plugins = [vuetify]

// Mock Config/i18n/utils
config.global.mocks = {
  $config: { public: Object.assign(helper.envConfig, helper.commonConfig, { env: { production: false, test: true } }) },
  $t: (key: string) => {
    let locale: any = helper.locales
    const parts = key.split('.')
    for (const part of parts) {
      locale = locale[part]
      // eslint-disable-next-line no-throw-literal
      if (locale == null) { throw `Not found: i18n(${key})` }
    }
    // eslint-disable-next-line no-throw-literal
    if (typeof locale !== 'string') { throw `Type error: i18n(${key})` }
    return locale
  },
  $tm: (key: string) => {
    let locale: any = helper.locales
    const parts = key.split('.')
    for (const part of parts) {
      locale = locale[part]
      // eslint-disable-next-line no-throw-literal
      if (locale == null) { throw `Not found: i18n(${key})` }
    }
    return locale
  },
  ...TestPluginUtils
}
vi.stubGlobal('useRuntimeConfig', vi.fn(() => config.global.mocks.$config))
vi.stubGlobal('useI18n', vi.fn(() => ({ t: config.global.mocks.$t })))

// NOTE: Failed to resolve component: NuxtLink
config.global.stubs.NuxtLink = RouterLinkStub

// NOTE: [Vuetify] Could not find injected layout
config.global.stubs.VLayoutItem = true // injection "Symbol(vuetify:layout)" not found. / Component is missing template or render function.
