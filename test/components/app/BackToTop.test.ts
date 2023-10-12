import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import Component from '~/components/app/BackToTop.vue'

describe('BackToTop.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      scrollTo: vi.fn()
    }
  })

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

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 200 })
    const item = wrapper.find('#back_to_top_item')
    item.trigger('scroll')
    await flushPromises()
    expect(button.attributes('style')).toBe('display: none;') // 非表示

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 201 })
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: mock.scrollTo })
    item.trigger('scroll')
    await flushPromises()
    expect(button.attributes('style')).not.toBe('display: none;') // 表示

    button.trigger('click')
    helper.mockCalledTest(mock.scrollTo, 1, { top: 0, behavior: 'smooth' }) // 上に戻る
  })
})
