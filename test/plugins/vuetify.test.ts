import Plugin from '~/plugins/vuetify'

describe('vuetify.ts', () => {
  const mock = vi.fn()
  const nuxtApp: any = { vueApp: { use: mock } }

  it('設定される', () => {
    Plugin(nuxtApp)
    expect(mock).toBeCalledTimes(1)
  })
})
