import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Layout from '~/layouts/error.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('error.vue', () => {
  const mountFunction = (statusCode, alert = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Layout, {
      localVue,
      vuetify,
      propsData: {
        error: {
          statusCode,
          alert
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, alertMessage) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/')).toBe(true) // トップページ

    expect(wrapper.vm.alertMessage).toEqual(alertMessage)
  }

  // テストケース
  describe('alertなし', () => {
    it('[404]表示される', () => {
      const wrapper = mountFunction(404)
      viewTest(wrapper, helper.locales.system.notfound)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500)
      viewTest(wrapper, helper.locales.system.default)
    })
  })
  describe('alertあり', () => {
    const alertMessage = 'alertメッセージ'
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, alertMessage)
      viewTest(wrapper, alertMessage)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, alertMessage)
      viewTest(wrapper, alertMessage)
    })
  })
})
