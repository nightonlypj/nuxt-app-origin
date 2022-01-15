import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/infomations/Label.vue'

describe('Label.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (list) => {
    return mount(Component, {
      localVue,
      vuetify,
      propsData: {
        list
      }
    })
  }

  const commonNotTest = (list) => {
    const wrapper = mountFunction(list)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (list, color) => {
    const wrapper = mountFunction(list)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.html()).toMatch(color)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(list.label_i18n)
  }

  it('[null]表示されない', () => {
    commonNotTest(null)
  })
  it('[なし]表示されない', () => {
    commonNotTest({ label: 'Not', label_i18n: '' })
  })
  it('[メンテナンス]表示される', () => {
    commonViewTest({ label: 'Maintenance', label_i18n: 'メンテナンス' }, 'error')
  })
  it('[障害]表示される', () => {
    commonViewTest({ label: 'Hindrance', label_i18n: '障害' }, 'warning')
  })
  it('[その他]表示される', () => {
    commonViewTest({ label: 'Other', label_i18n: 'その他' }, 'info')
  })
})
