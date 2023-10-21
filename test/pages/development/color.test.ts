import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Page from '~/pages/development/color.vue'

describe('color.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      toast: helper.mockToast
    }
  })

  const mountFunction = () => {
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({ $toast: mock.toast })))

    const wrapper = mount(Page)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any) => {
    helper.presentTest(wrapper)
    helper.toastMessageTest(mock.toast, { error: 'error', info: 'info', warning: 'warning', success: 'success' })
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    viewTest(wrapper)
  })
})
