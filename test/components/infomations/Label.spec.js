import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/infomations/Label.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Label.vue', () => {
  const mountFunction = (infomation) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        infomation
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, color, infomation) => {
    // console.log(wrapper.html())
    // console.log(wrapper.text())
    expect(wrapper.html()).toMatch(color)
    expect(wrapper.text()).toMatch(infomation.label_i18n)
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[なし]表示されない', () => {
    const infomation = Object.freeze({ label: 'not', label_i18n: '' })
    const wrapper = mountFunction(infomation)
    helper.blankTest(wrapper)
  })
  it('[メンテナンス]表示される', () => {
    const infomation = Object.freeze({ label: 'maintenance', label_i18n: 'メンテナンス' })
    const wrapper = mountFunction(infomation)
    viewTest(wrapper, 'error', infomation)
  })
  it('[障害]表示される', () => {
    const infomation = Object.freeze({ label: 'hindrance', label_i18n: '障害' })
    const wrapper = mountFunction(infomation)
    viewTest(wrapper, 'warning', infomation)
  })
  it('[その他]表示される', () => {
    const infomation = Object.freeze({ label: 'other', label_i18n: 'その他' })
    const wrapper = mountFunction(infomation)
    viewTest(wrapper, 'info', infomation)
  })
})
