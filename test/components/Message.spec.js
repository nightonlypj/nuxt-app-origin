import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Message.vue'

describe('Message.vue', () => {
  const mountFunction = (alert, notice) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        alert,
        notice
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonNotTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (wrapper, alert, notice) => {
    // console.log(wrapper.text())
    if (alert !== null) {
      expect(wrapper.text()).toMatch(alert)
    }
    if (notice !== null) {
      expect(wrapper.text()).toMatch(notice)
    }
  }

  it('[alertなし/noticeなし]表示されない', () => {
    const wrapper = mountFunction(null, null)
    commonNotTest(wrapper)
  })
  it('[alertなし/noticeあり]表示される', () => {
    const wrapper = mountFunction(null, 'noticeメッセージ')
    commonViewTest(wrapper, null, 'noticeメッセージ')
  })
  it('[alertあり/noticeなし]表示される', () => {
    const wrapper = mountFunction('alertメッセージ', null)
    commonViewTest(wrapper, 'alertメッセージ', null)
  })
  it('[alertあり/noticeあり]表示される', () => {
    const wrapper = mountFunction('alertメッセージ', 'noticeメッセージ')
    commonViewTest(wrapper, 'alertメッセージ', 'noticeメッセージ')
  })
})
