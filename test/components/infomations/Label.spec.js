import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/infomations/Label.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Label.vue', () => {
  const mountFunction = (list) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        list: (list != null) ? { ...list } : null
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, color, list) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toMatch(color)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(list.label_i18n)
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[なし]表示されない', () => {
    const list = Object.freeze({ label: 'Not', label_i18n: '' })
    const wrapper = mountFunction(list)
    helper.blankTest(wrapper)
  })
  it('[メンテナンス]表示される', () => {
    const list = Object.freeze({ label: 'Maintenance', label_i18n: 'メンテナンス' })
    const wrapper = mountFunction(list)
    viewTest(wrapper, 'error', list)
  })
  it('[障害]表示される', () => {
    const list = Object.freeze({ label: 'Hindrance', label_i18n: '障害' })
    const wrapper = mountFunction(list)
    viewTest(wrapper, 'warning', list)
  })
  it('[その他]表示される', () => {
    const list = Object.freeze({ label: 'Other', label_i18n: 'その他' })
    const wrapper = mountFunction(list)
    viewTest(wrapper, 'info', list)
  })
})
