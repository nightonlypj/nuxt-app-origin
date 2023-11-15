import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/users/DestroyInfo.vue'
import { activeUser, destroyUser } from '~/test/data/user'

describe('DestroyInfo.vue', () => {
  const mountFunction = (loggedIn: boolean, path = '/', user: object | null = null) => {
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      }
    })))
    vi.stubGlobal('useRoute', vi.fn(() => ({
      path
    })))

    const wrapper = mount(Component)
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, user: any) => {
    expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', user.destroy_schedule_at)) // 削除予定日
    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/undo_delete')).toBe(true) // アカウント削除取り消し
  }

  // テストケース
  it('[未ログイン]表示されない', () => {
    const wrapper = mountFunction(false)
    helper.blankTest(wrapper)
  })
  it('[ログイン中]表示されない', () => {
    const wrapper = mountFunction(true, '/', activeUser)
    helper.blankTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示される', () => {
    const wrapper = mountFunction(true, '/', destroyUser)
    viewTest(wrapper, destroyUser)
  })

  describe('アカウント削除取り消しページ', () => {
    const path = '/users/undo_delete'
    it('[未ログイン]表示されない', () => {
      const wrapper = mountFunction(false, path)
      helper.blankTest(wrapper)
    })
    it('[ログイン中]表示されない', () => {
      const wrapper = mountFunction(true, path, activeUser)
      helper.blankTest(wrapper)
    })
    it('[ログイン中（削除予約済み）]表示されない', () => {
      const wrapper = mountFunction(true, path, destroyUser)
      helper.blankTest(wrapper)
    })
  })
})
