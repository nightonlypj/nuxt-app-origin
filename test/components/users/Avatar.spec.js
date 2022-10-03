import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/users/Avatar.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Avatar.vue', () => {
  const mountFunction = (user) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        user
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, user) => {
    expect(wrapper.text()).toMatch(user.name) // ユーザーの氏名
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[あり]表示される', () => {
    const user = Object.freeze({
      name: 'user1の氏名',
      image_url: {
        small: 'https://example.com/images/user/small_noimage.jpg'
      }
    })
    const wrapper = mountFunction(user)
    viewTest(wrapper, user)
  })
})
