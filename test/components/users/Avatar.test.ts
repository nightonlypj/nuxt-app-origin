import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/users/Avatar.vue'

describe('Avatar.vue', () => {
  const mountFunction = (props = {}) => {
    const wrapper = mount(Component, {
      props
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction({})
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
    const wrapper = mountFunction({ user })
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
    const wrapper = mountFunction({ user })
    expect(wrapper.text()).toMatch(user.name) // 氏名
    expect(wrapper.find(`#user_destroy_schedule_${user.code}`).exists()).toBe(true) // 削除予定
  })
  it('[あり（アカウント削除済み）]表示される', () => {
    const user = Object.freeze({
      deleted: true
    })
    const wrapper = mountFunction({ user })
    expect(wrapper.text()).toMatch('N/A')
  })
})
