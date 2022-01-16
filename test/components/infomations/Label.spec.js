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
        list
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonNotTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (wrapper, color, labelI18n) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toMatch(color)

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(labelI18n)
  }

  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    commonNotTest(wrapper)
  })
  it('[なし]表示されない', () => {
    const wrapper = mountFunction({ label: 'Not', label_i18n: '' })
    commonNotTest(wrapper)
  })
  it('[メンテナンス]表示される', () => {
    const wrapper = mountFunction({ label: 'Maintenance', label_i18n: 'メンテナンス' })
    commonViewTest(wrapper, 'error', 'メンテナンス')
  })
  it('[障害]表示される', () => {
    const wrapper = mountFunction({ label: 'Hindrance', label_i18n: '障害' })
    commonViewTest(wrapper, 'warning', '障害')
  })
  it('[その他]表示される', () => {
    const wrapper = mountFunction({ label: 'Other', label_i18n: 'その他' })
    commonViewTest(wrapper, 'info', 'その他')
  })
})
