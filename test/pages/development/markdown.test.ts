import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Page from '~/pages/development/markdown.vue'

describe('markdown.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Page)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  it('表示される', () => {
    const wrapper = mountFunction()
    helper.presentTest(wrapper)
  })
})
