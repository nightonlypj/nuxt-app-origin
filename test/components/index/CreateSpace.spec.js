import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SpacesCreate from '~/components/spaces/Create.vue'
import Component from '~/components/index/CreateSpace.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('CreateSpace.vue', () => {
  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        SpacesCreate: true
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/spaces')).toBe(true) // スペース一覧
    expect(wrapper.findComponent(SpacesCreate).exists()).toBe(true) // スペース作成
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    viewTest(wrapper)
  })
})
