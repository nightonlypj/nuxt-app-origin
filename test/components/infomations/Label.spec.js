import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/infomations/Label.vue'

describe('Label.vue', () => {
  const mountFunction = (list) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        list: (list !== null) ? { ...list } : null
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonNotTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (wrapper, color, list) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toMatch(color)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(list.label_i18n)
  }

  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    commonNotTest(wrapper)
  })
  it('[なし]表示されない', () => {
    const list = Object.freeze({ label: 'Not', label_i18n: '' })
    const wrapper = mountFunction(list)
    commonNotTest(wrapper)
  })
  it('[メンテナンス]表示される', () => {
    const list = Object.freeze({ label: 'Maintenance', label_i18n: 'メンテナンス' })
    const wrapper = mountFunction(list)
    commonViewTest(wrapper, 'error', list)
  })
  it('[障害]表示される', () => {
    const list = Object.freeze({ label: 'Hindrance', label_i18n: '障害' })
    const wrapper = mountFunction(list)
    commonViewTest(wrapper, 'warning', list)
  })
  it('[その他]表示される', () => {
    const list = Object.freeze({ label: 'Other', label_i18n: 'その他' })
    const wrapper = mountFunction(list)
    commonViewTest(wrapper, 'info', list)
  })
})
