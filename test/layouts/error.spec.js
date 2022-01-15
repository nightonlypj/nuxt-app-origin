import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Layout from '~/layouts/error.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('error.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (statusCode) => {
    return mount(Layout, {
      localVue,
      vuetify,
      propsData: {
        error: {
          statusCode
        }
      }
    })
  }

  const commonViewTest = (statusCode) => {
    const wrapper = mountFunction(statusCode)
    expect(wrapper.vm).toBeTruthy()

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/')).toBe(true) // トップページ
  }

  it('[404]表示される', () => {
    commonViewTest(404)
  })
  it('[500]表示される', () => {
    commonViewTest(500)
  })
})
