import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
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
  const viewTest = (wrapper, title, alert) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/')).toBe(true) // トップページ

    expect(wrapper.vm.title).toEqual(title)
    expect(wrapper.vm.alert).toEqual(alert)
  }

  // テストケース
  const title = { notfound: 'Not Found', error: 'Error' }
  describe('alertなし', () => {
    it('[404]表示される', () => {
      const wrapper = mountFunction(404)
      viewTest(wrapper, title.notfound, locales.system.notfound)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500)
      viewTest(wrapper, title.error, locales.system.default)
    })
  })
  describe('alertあり', () => {
    const alert = 'alertメッセージ'
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, alert)
      viewTest(wrapper, title.notfound, alert)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, alert)
      viewTest(wrapper, title.error, alert)
    })
  })
})
