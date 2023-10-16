import { mount } from '@vue/test-utils'
import Component from '~/components/app/RequiredLabel.vue'

describe('RequiredLabel.vue', () => {
  const mountFunction = (props = {}) => {
    const wrapper = mount(Component, {
      props
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, optional: boolean) => {
    expect(wrapper.text()).toMatch(optional ? '任意' : '必須')
  }

  // テストケース
  it('[optionalがない]必須ラベルが表示される', () => {
    const wrapper = mountFunction({})
    viewTest(wrapper, false)
  })
  it('[optionalがfalse]必須ラベルが表示される', () => {
    const wrapper = mountFunction({ optional: false })
    viewTest(wrapper, false)
  })
  it('[optionalがtrue]任意ラベルが表示される', () => {
    const wrapper = mountFunction({ optional: true })
    viewTest(wrapper, true)
  })
})
