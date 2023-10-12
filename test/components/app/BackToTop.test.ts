import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import Component from '~/components/app/BackToTop.vue'

describe('BackToTop.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Component)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('ボタン非表示。200スクロールしても非表示。201以上で表示。クリックで上に戻る', async () => {
    const wrapper = mountFunction()
    const button = wrapper.find('#back_to_top_btn')
    expect(button.attributes('style')).toBe('display: none;') // 非表示 // NOTE: .isVisible()だとtrueになる為

    Object.defineProperty(window, 'scrollY', { value: 200 })
    const item = wrapper.find('#back_to_top_item')
    item.trigger('scroll')
    await flushPromises()
    expect(button.attributes('style')).toBe('display: none;') // 非表示

    const mockScrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { value: mockScrollTo })
    Object.defineProperty(window, 'scrollY', { value: 201 })
    item.trigger('scroll')
    await flushPromises()
    expect(button.attributes('style')).not.toBe('display: none;') // 表示

    button.trigger('click')
    helper.mockCalledTest(mockScrollTo, 1, { top: 0, behavior: 'smooth' }) // 上に戻る
  })
})
