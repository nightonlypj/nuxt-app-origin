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

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[あり]表示される', () => {
    const user = Object.freeze({
      code: 'code000000000000000000001',
      name: 'user1の氏名',
      image_url: {
        small: 'https://example.com/images/user/small_noimage.jpg'
      },
      deleted: false
    })
    const wrapper = mountFunction(user)
    expect(wrapper.text()).toMatch(user.name) // 氏名
    expect(wrapper.find(`#user_destroy_schedule_${user.code}`).exists()).toBe(false) // 削除予定
  })
  it('[あり（削除予定）]表示される', () => {
    const user = Object.freeze({
      code: 'code000000000000000000001',
      name: 'user1の氏名',
      image_url: {
        small: 'https://example.com/images/user/small_noimage.jpg'
      },
      destroy_schedule_at: '2000-01-08T12:34:56+09:00',
      deleted: false
    })
    const wrapper = mountFunction(user)
    expect(wrapper.text()).toMatch(user.name) // 氏名
    expect(wrapper.find(`#user_destroy_schedule_${user.code}`).exists()).toBe(true) // 削除予定
  })
  it('[あり（アカウント削除済み）]表示される', () => {
    const user = Object.freeze({
      deleted: true
    })
    const wrapper = mountFunction(user)
    expect(wrapper.text()).toMatch('N/A')
  })
})
