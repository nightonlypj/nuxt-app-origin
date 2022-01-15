import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/Message.vue'

describe('Message.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (alert, notice) => {
    return mount(Component, {
      localVue,
      vuetify,
      propsData: {
        alert,
        notice
      }
    })
  }

  const alert = 'alertメッセージ'
  const notice = 'noticeメッセージ'

  it('[alertなし/noticeなし]表示されない', () => {
    const wrapper = mountFunction(null, null)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  })
  it('[alertなし/noticeあり]表示される', () => {
    const wrapper = mountFunction(null, notice)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.text())
    expect(wrapper.text()).not.toMatch(alert)
    expect(wrapper.text()).toMatch(notice)
  })
  it('[alertあり/noticeなし]表示される', () => {
    const wrapper = mountFunction(alert, null)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(alert)
    expect(wrapper.text()).not.toMatch(notice)
  })
  it('[alertあり/noticeあり]表示される', () => {
    const wrapper = mountFunction(alert, notice)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(alert)
    expect(wrapper.text()).toMatch(notice)
  })
})
