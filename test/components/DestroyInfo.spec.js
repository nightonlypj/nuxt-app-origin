import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/DestroyInfo.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('DestroyInfo.vue', () => {
  const mountFunction = (path, loggedIn, user = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      mocks: {
        $route: {
          path
        },
        $auth: {
          loggedIn,
          user: { ...user }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, user) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/undo_delete')).toBe(true) // アカウント削除取り消し
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat(user.destroy_schedule_at, 'ja')) // 削除予定日
  }

  // テストケース
  it('[未ログイン]表示されない', () => {
    const wrapper = mountFunction('/', false)
    helper.blankTest(wrapper)
  })
  it('[ログイン中]表示されない', () => {
    const wrapper = mountFunction('/', true)
    helper.blankTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示される', () => {
    const user = Object.freeze({ destroy_schedule_at: '2000-01-01T12:34:56+09:00' })
    const wrapper = mountFunction('/', true, user)
    viewTest(wrapper, user)
  })

  describe('アカウント削除取り消しページ', () => {
    const path = '/users/undo_delete'
    it('[未ログイン]表示されない', () => {
      const wrapper = mountFunction(path, false)
      helper.blankTest(wrapper)
    })
    it('[ログイン中]表示されない', () => {
      const wrapper = mountFunction(path, true)
      helper.blankTest(wrapper)
    })
    it('[ログイン中（削除予約済み）]表示されない', () => {
      const user = Object.freeze({ destroy_schedule_at: '2000-01-01T12:34:56+09:00' })
      const wrapper = mountFunction(path, true, user)
      helper.blankTest(wrapper)
    })
  })
})
