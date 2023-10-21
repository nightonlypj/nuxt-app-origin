import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import AppProcessing from '~/components/app/Processing.vue'
import Page from '~/pages/users/sign_out.vue'

describe('sign_out.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useAuthSignOut: vi.fn(),
      useAuthRedirect: { updateRedirectUrl: vi.fn() },
      navigateTo: vi.fn(),
      toast: helper.mockToast
    }
  })

  const mountFunction = (loggedIn: boolean) => {
    vi.stubGlobal('useAuthSignOut', mock.useAuthSignOut)
    vi.stubGlobal('useAuthRedirect', vi.fn(() => mock.useAuthRedirect))
    vi.stubGlobal('navigateTo', mock.navigateTo)

    const wrapper = mount(Page, {
      global: {
        stubs: {
          AppProcessing: true
        },
        mocks: {
          $auth: {
            loggedIn
          },
          $toast: mock.toast
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any) => {
    expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)

    // ログアウトボタン
    const button: any = wrapper.find('#sign_out_btn')
    expect(button.exists()).toBe(true)
    expect(button.element.disabled).toBe(false) // 有効
  }

  // テストケース
  it('[未ログイン]トップページにリダイレクトされる', () => {
    mountFunction(false)
    helper.toastMessageTest(mock.toast, { info: helper.locales.auth.already_signed_out })
    helper.mockCalledTest(mock.navigateTo, 1, '/')
  })
  it('[ログイン中]表示される', () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper)
  })

  describe('ログアウト', () => {
    it('[成功]未ログイン状態になり、ログインページにリダイレクトされる', async () => {
      const wrapper = mountFunction(true)
      wrapper.find('#sign_out_btn').trigger('click')
      await flushPromises()

      helper.mockCalledTest(mock.useAuthSignOut, 1)
      helper.toastMessageTest(mock.toast, { success: helper.locales.auth.signed_out })
      helper.mockCalledTest(mock.navigateTo, 1, helper.commonConfig.authRedirectLogOutURL)
      helper.mockCalledTest(mock.useAuthRedirect.updateRedirectUrl, 0)
    })
  })
})
