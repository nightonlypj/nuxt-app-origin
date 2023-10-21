import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/members/OnlyIcon.vue'

describe('OnlyIcon.vue', () => {
  const mountFunction = (power: any) => {
    const wrapper = mount(Component, {
      props: {
        power
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, power: string) => {
    expect(wrapper.html()).toMatch(helper.commonConfig.member.powerIcon[power]) // 権限
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[admin]表示される', () => {
    const power = 'admin'
    const wrapper = mountFunction(power)
    viewTest(wrapper, power)
  })
})
