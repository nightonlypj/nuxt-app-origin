import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Layout from '~/layouts/error.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('error.vue', () => {
  const mountFunction = (statusCode) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Layout, {
      localVue,
      vuetify,
      propsData: {
        error: {
          statusCode
        }
      },
      mocks: {
        $config: {
          debug: false
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/')).toBe(true) // トップページ
  }

  // テストケース
  it('[404]表示される', () => {
    const wrapper = mountFunction(404)
    viewTest(wrapper)
  })
  it('[500]表示される', () => {
    const wrapper = mountFunction(500)
    viewTest(wrapper)
  })
})
