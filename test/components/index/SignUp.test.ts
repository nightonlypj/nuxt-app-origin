import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/index/SignUp.vue'

describe('SignUp.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Component)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/sign_up')).toBe(true) // アカウント登録
    expect(links.includes('/users/sign_in')).toBe(true) // ログイン
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    viewTest(wrapper)
  })
})
