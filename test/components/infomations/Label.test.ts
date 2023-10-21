import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/infomations/Label.vue'

describe('Label.vue', () => {
  const mountFunction = (infomation: object | null) => {
    const wrapper = mount(Component, {
      props: {
        infomation
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, color: string, infomation: any) => {
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
  it('[アップデート]表示される', () => {
    const infomation = Object.freeze({ label: 'update', label_i18n: 'アップデート' })
    const wrapper = mountFunction(infomation)
    viewTest(wrapper, 'info', infomation)
  })
  it('[その他]表示される', () => {
    const infomation = Object.freeze({ label: 'other', label_i18n: 'その他' })
    const wrapper = mountFunction(infomation)
    viewTest(wrapper, 'info', infomation)
  })
})
