import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/DestroyInfo.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('DestroyInfo.vue', () => {
  const mountFunction = (path, loggedIn, user) => {
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

  const commonNotTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (wrapper, destroyScheduleDate) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/undo_delete')).toBe(true) // アカウント削除取り消し

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(destroyScheduleDate) // 削除予定日
  }

  it('[未ログイン]表示されない', () => {
    const wrapper = mountFunction('/', false, null)
    commonNotTest(wrapper)
  })
  it('[ログイン中]表示されない', () => {
    const wrapper = mountFunction('/', true, null)
    commonNotTest(wrapper)
  })
  it('[ログイン中（削除予約済み）]表示される', () => {
    const user = Object.freeze({ destroy_schedule_at: '2021-01-01T09:00:00+09:00' })
    const wrapper = mountFunction('/', true, user)
    commonViewTest(wrapper, '2021/01/01')
  })

  describe('アカウント削除取り消しページ', () => {
    const path = '/users/undo_delete'
    it('[未ログイン]表示されない', () => {
      const wrapper = mountFunction(path, false, null)
      commonNotTest(wrapper)
    })
    it('[ログイン中]表示されない', () => {
      const wrapper = mountFunction(path, true, null)
      commonNotTest(wrapper)
    })
    it('[ログイン中（削除予約済み）]表示されない', () => {
      const user = Object.freeze({ destroy_schedule_at: '2021-01-01T09:00:00+09:00' })
      const wrapper = mountFunction(path, true, user)
      commonNotTest(wrapper)
    })
  })
})
