import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/users/Avatar.vue'
import { activeUser, destroyUser, deletedUser } from '~/test/data/user'

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
    const wrapper = mountFunction({ user: activeUser })
    expect(wrapper.text()).toMatch(activeUser.name) // 氏名
    expect(wrapper.find(`#user_destroy_schedule_${activeUser.code}`).exists()).toBe(false) // 削除予定
  })
  it('[あり（削除予定）]表示される', () => {
    const wrapper = mountFunction({ user: destroyUser })
    expect(wrapper.text()).toMatch(destroyUser.name) // 氏名
    expect(wrapper.find(`#user_destroy_schedule_${destroyUser.code}`).exists()).toBe(true) // 削除予定
  })
  it('[あり（アカウント削除済み）]表示される', () => {
    const wrapper = mountFunction({ user: deletedUser })
    expect(wrapper.text()).toMatch('N/A')
  })
})
