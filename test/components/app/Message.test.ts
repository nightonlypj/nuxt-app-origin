import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/app/Message.vue'

describe('Message.vue', () => {
  const mountFunction = (props = {}) => {
    const wrapper = mount(Component, {
      props
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, message: string) => {
    expect(wrapper.text()).toMatch(message)
  }

  // テストケース
  const alert = 'alertメッセージ'
  const notice = 'noticeメッセージ'
  it('[alert/noticeなし]表示されない', () => {
    const wrapper = mountFunction({})
    helper.blankTest(wrapper)
  })
  it('[alertなし/noticeあり]表示される', () => {
    const wrapper = mountFunction({ notice })
    viewTest(wrapper, notice)
  })
  it('[alertあり/noticeなし]表示される', () => {
    const wrapper = mountFunction({ alert })
    viewTest(wrapper, alert)
  })
  it('[alert/noticeあり]表示される', () => {
    const wrapper = mountFunction({ alert, notice })
    viewTest(wrapper, alert)
    viewTest(wrapper, notice)
  })
})
