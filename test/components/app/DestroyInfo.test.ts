import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/app/DestroyInfo.vue'

describe('DestroyInfo.vue', () => {
  const mountFunction = (loggedIn: boolean, path = '/', user: object | null = null) => {
    const wrapper = mount(Component, {
      global: {
        mocks: {
          $auth: {
            loggedIn,
            user
          },
          $route: {
            path
          }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', user.destroy_schedule_at)) // 削除予定日
    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/undo_delete')).toBe(true) // アカウント削除取り消し
  }

  // テストケース
  it('[未ログイン]表示されない', () => {
    const wrapper = mountFunction(false)
    helper.blankTest(wrapper)
  })
  it('[ログイン中]表示されない', () => {
    const wrapper = mountFunction(true, '/', {})
    helper.blankTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示される', () => {
    const user = Object.freeze({ destroy_schedule_at: '2000-01-01T12:34:56+09:00' })
    const wrapper = mountFunction(true, '/', user)
    viewTest(wrapper, user)
  })

  describe('アカウント削除取り消しページ', () => {
    const path = '/users/undo_delete'
    it('[未ログイン]表示されない', () => {
      const wrapper = mountFunction(false, path)
      helper.blankTest(wrapper)
    })
    it('[ログイン中]表示されない', () => {
      const wrapper = mountFunction(true, path, {})
      helper.blankTest(wrapper)
    })
    it('[ログイン中（削除予約済み）]表示されない', () => {
      const user = Object.freeze({ destroy_schedule_at: '2000-01-01T12:34:56+09:00' })
      const wrapper = mountFunction(true, path, user)
      helper.blankTest(wrapper)
    })
  })
})
