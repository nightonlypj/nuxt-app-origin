import Plugin from '~/plugins/toast'

describe('toast.ts', () => {
  const nuxtApp: any = { vueApp: { use: vi.fn() } }

  it('toastが存在する', () => {
    expect((Plugin(nuxtApp) as any).provide.toast).not.toBeNull()
  })
})
