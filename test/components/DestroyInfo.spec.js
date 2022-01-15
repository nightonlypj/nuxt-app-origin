import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/DestroyInfo.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('DestroyInfo.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (path, loggedIn, user) => {
    return mount(Component, {
      localVue,
      vuetify,
      mocks: {
        $route: {
          path
        },
        $auth: {
          loggedIn,
          user
        }
      }
    })
  }

  const commonNotTest = (wrapper) => {
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.html()).toBe('')
  }
  const commonViewTest = (wrapper, destroyScheduleDate) => {
    expect(wrapper.vm).toBeTruthy()

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/undo_delete')).toBe(true) // アカウント削除取り消し

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(destroyScheduleDate) // 削除予定日
  }

  it('[未ログイン]表示されない', () => {
    commonNotTest(mountFunction('/', false, null))
  })
  it('[ログイン中]表示されない', () => {
    commonNotTest(mountFunction('/', true, null))
  })
  it('[ログイン中（削除予約済み）]表示される', () => {
    commonViewTest(mountFunction('/', true, { destroy_schedule_at: '2021-01-01T09:00:00+09:00' }), '2021/01/01')
  })

  describe('アカウント削除取り消しページ', () => {
    const path = '/users/undo_delete'
    it('[未ログイン]表示されない', () => {
      commonNotTest(mountFunction(path, false, null))
    })
    it('[ログイン中]表示されない', () => {
      commonNotTest(mountFunction(path, true, null))
    })
    it('[ログイン中（削除予約済み）]表示されない', () => {
      commonNotTest(mountFunction(path, true, { destroy_schedule_at: '2021-01-01T09:00:00+09:00' }))
    })
  })
})
