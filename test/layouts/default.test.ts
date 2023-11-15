import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import UsersDestroyInfo from '~/components/users/DestroyInfo.vue'
import AppBackToTop from '~/components/app/BackToTop.vue'
import Layout from '~/layouts/default.vue'
import { activeUser } from '~/test/data/user'
import { listMiniCount2 } from '~/test/data/spaces'

describe('default.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      useHead: vi.fn()
    }
  })

  const mountFunction = (loggedIn: boolean, user: object | null = null) => {
    vi.stubGlobal('useHead', mock.useHead)
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn,
        user
      }
    })))

    const wrapper = mount(Layout, {
      global: {
        stubs: {
          UsersDestroyInfo: true,
          AppBackToTop: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, loggedIn: boolean, user: any = {}) => {
    expect(wrapper.findComponent(UsersDestroyInfo).exists()).toBe(true) // アカウント削除予約
    expect(wrapper.findComponent(AppBackToTop).exists()).toBe(true) // 上に戻る

    // タイトル
    helper.mockCalledTest(mock.useHead, 1, { titleTemplate: wrapper.vm.titleTemplate })
    expect(wrapper.vm.titleTemplate()).toBe(`${helper.locales.app_name}${helper.envConfig.envName}`)
    expect(wrapper.vm.titleTemplate('タイトル')).toBe(`タイトル - ${helper.locales.app_name}${helper.envConfig.envName}`)

    const links = helper.getLinks(wrapper)
    expect(links.includes('/')).toBe(true) // トップページ
    expect(links.includes('/users/sign_in')).toBe(!loggedIn) // [未ログイン]ログイン
    expect(links.includes('/users/sign_up')).toBe(!loggedIn) // [未ログイン]アカウント登録
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
    expect(links.includes('/users/update')).toBe(loggedIn) // [ログイン中]ユーザー情報変更
    expect(links.includes('/users/sign_out')).toBe(loggedIn) // [ログイン中]ログアウト

    expect(wrapper.text()).toMatch(helper.envConfig.envName)
    if (loggedIn) {
      expect(wrapper.text()).toMatch(user.name) // ユーザーの氏名
      expect(wrapper.text()).toMatch('9+') // お知らせの未読数
      expect(wrapper.text()).toMatch(String(user.undownloaded_count)) // 未ダウンロード数

      for (const space of user.spaces) { // 参加スペース
        expect(wrapper.find(`#navigation_space_link_${space.code}`).exists()).toBe(true)
        expect(wrapper.find(`#navigation_space_image_${space.code}`).exists()).toBe(space.image_url != null)
        expect(wrapper.html()).toMatch(space.name)
      }
    } else {
      expect(wrapper.text()).not.toMatch('9+')
    }
    expect(wrapper.find('#header_menu_user_image').exists()).toBe(loggedIn) // [ログイン中]ユーザーの画像
    expect(wrapper.find('#navigation_user_image').exists()).toBe(loggedIn)
  }

  // テストケース
  it('[未ログイン]表示される', () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper, false)
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({
      ...activeUser,
      infomation_unread_count: 10, // -> 9+
      undownloaded_count: 123,
      spaces: listMiniCount2
    })
    const wrapper = mountFunction(true, user)

    // ユーザー名クリック時のメニュー表示
    const button: any = wrapper.find('#header_menu_user_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await flushPromises()

    viewTest(wrapper, true, user)
  })
})
