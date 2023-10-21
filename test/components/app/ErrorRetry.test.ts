import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/app/ErrorRetry.vue'

describe('ErrorRetry.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Component)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    helper.presentTest(wrapper)

    // 再取得ボタン
    const button = wrapper.find('#error_retry_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
  })
})
