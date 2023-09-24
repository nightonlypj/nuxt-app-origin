import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/app/Processing.vue'

describe('Processing.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Component)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    helper.presentTest(wrapper)
  })
})
