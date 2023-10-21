import { mount } from '@vue/test-utils'
import Layout from '~/app.vue'

describe('app.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Layout)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    expect(wrapper.html()).toMatch('<nuxtpage></nuxtpage>')
  })
})
