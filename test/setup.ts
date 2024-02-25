import { createI18n } from 'vue-i18n'
import { config, RouterLinkStub } from '@vue/test-utils'
import { commonConfig } from '../config/common'
import { envConfig } from '../config/test'
import { vuetify } from '~/plugins/vuetify'
import veeValidate from '~/plugins/veeValidate'
import i18nConfig, { locales } from '~/i18n.config'
import helper from '~/test/helper'

// NOTE: 他のテストの影響を受けないようにする
afterEach(() => {
  vi.restoreAllMocks()
})

// Vuetify
global.ResizeObserver = require('resize-observer-polyfill')
config.global.plugins = [vuetify]

// VeeValidate
veeValidate(null as any)

// Mock Config/i18n
const i18n: any = createI18n({ ...i18nConfig, locale: helper.locale })
config.global.mocks = {
  $config: { public: Object.assign(commonConfig, envConfig, { env: { production: false, development: false, test: true } }) },
  $t: (...args: any[]) => i18n.global.t(...args),
  $tm: (key: string) => i18n.global.tm(key)
}
vi.stubGlobal('useRuntimeConfig', vi.fn(() => config.global.mocks.$config))
vi.stubGlobal('useI18n', vi.fn(() => ({ t: config.global.mocks.$t, tm: config.global.mocks.$tm, locale: ref(helper.locale), locales: ref(locales) })))
vi.stubGlobal('useLocalePath', vi.fn(() => (url: string) => url))

// NOTE: Failed to resolve component: NuxtLink
config.global.stubs.NuxtLink = RouterLinkStub
