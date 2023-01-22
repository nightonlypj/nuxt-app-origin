import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Message.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Message.vue', () => {
  const mountFunction = (propsData) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, message) => {
    expect(wrapper.text()).toMatch(message)
  }

  // テストケース
  it('[alertなし/noticeなし]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[alertなし/noticeあり]表示される', () => {
    const notice = 'noticeメッセージ'
    const wrapper = mountFunction({ notice })
    viewTest(wrapper, notice)
  })
  it('[alertあり/noticeなし]表示される', () => {
    const alert = 'alertメッセージ'
    const wrapper = mountFunction({ alert })
    viewTest(wrapper, alert)
  })
  it('[alertあり/noticeあり]表示される', () => {
    const alert = 'alertメッセージ'
    const notice = 'noticeメッセージ'
    const wrapper = mountFunction({ alert, notice })
    viewTest(wrapper, alert)
    viewTest(wrapper, notice)
  })
})
