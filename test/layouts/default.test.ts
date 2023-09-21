import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import AppDestroyInfo from '~/components/app/DestroyInfo.vue'
import AppBackToTop from '~/components/app/BackToTop.vue'
import Layout from '~/layouts/default.vue'

describe('default.vue', () => {
  const mountFunction = (loggedIn: boolean, user: object | null = null) => {
    const wrapper = mount(Layout, {
      global: {
        stubs: {
          AppDestroyInfo: true,
          AppBackToTop: true
        },
        mocks: {
          $auth: {
            loggedIn,
            user
          }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, loggedIn: boolean) => {
    expect(wrapper.findComponent(AppDestroyInfo).exists()).toBe(true) // アカウント削除予約
    expect(wrapper.findComponent(AppBackToTop).exists()).toBe(true) // 上に戻る

    const links = helper.getLinks(wrapper)
    expect(links.includes('/')).toBe(true) // トップページ
    expect(links.includes('/users/sign_in')).toBe(!loggedIn) // [未ログイン]ログイン
    expect(links.includes('/users/sign_up')).toBe(!loggedIn) // [未ログイン]アカウント登録
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
    expect(links.includes('/users/update')).toBe(loggedIn) // [ログイン中]ユーザー情報変更
    expect(links.includes('/users/sign_out')).toBe(loggedIn) // [ログイン中]ログアウト

    expect(wrapper.text()).toMatch(helper.envConfig.envName)
    if (loggedIn) {
      expect(wrapper.text()).toMatch('user1の氏名') // ユーザーの氏名
      expect(wrapper.text()).toMatch('9+') // お知らせの未読数
    } else {
      expect(wrapper.text()).not.toMatch('user1の氏名')
      expect(wrapper.text()).not.toMatch('9+')
    }
    expect(wrapper.find('#user_image').exists()).toBe(loggedIn) // [ログイン中]ユーザーの画像
  }

  // テストケース
  it('[未ログイン]表示される', () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper, false)
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({
      name: 'user1の氏名',
      image_url: {
        small: 'https://example.com/images/user/small_noimage.jpg'
      },
      infomation_unread_count: 10
    })
    const wrapper = mountFunction(true, user)

    // ユーザー名クリック時のメニュー表示
    const button: any = wrapper.find('#user_menu_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    viewTest(wrapper, true)
  })
})
