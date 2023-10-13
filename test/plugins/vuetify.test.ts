import helper from '~/test/helper'
import Plugin, { vuetify } from '~/plugins/vuetify'

describe('vuetify.ts', () => {
  const mock = vi.fn()
  const nuxtApp: any = { vueApp: { use: mock } }

  it('nuxtApp.vueApp.useにvuetifyが設定される', () => {
    Plugin(nuxtApp)
    helper.mockCalledTest(mock, 1, vuetify)
  })
})
