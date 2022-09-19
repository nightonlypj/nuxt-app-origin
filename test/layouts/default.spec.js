import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import GoTop from '@inotom/vue-go-top'
import DestroyInfo from '~/components/DestroyInfo.vue'
import Layout from '~/layouts/default.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('default.vue', () => {
  const mountFunction = (loggedIn, user) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Layout, {
      localVue,
      vuetify,
      stubs: {
        GoTop: true,
        Nuxt: true
      },
      mocks: {
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
  const viewTest = (wrapper, loggedIn) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(GoTop).exists()).toBe(true) // 上に戻る
    expect(wrapper.findComponent(DestroyInfo).exists()).toBe(true) // アカウント削除予約
    expect(wrapper.html()).toMatch('<nuxt-stub></nuxt-stub>')

    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/')).toBe(true) // トップページ
    expect(links.includes('/users/sign_in')).toBe(!loggedIn) // [未ログイン]ログイン
    expect(links.includes('/users/sign_up')).toBe(!loggedIn) // [未ログイン]アカウント登録
    expect(links.includes('/infomations')).toBe(true) // お知らせ一覧
    expect(links.includes('/users/update')).toBe(loggedIn) // [ログイン中]登録情報変更
    expect(links.includes('/users/sign_out')).toBe(loggedIn) // [ログイン中]ログアウト

    // console.log(wrapper.text())
    expect(wrapper.text()).toMatch(helper.envConfig.envName)
    if (loggedIn) {
      expect(wrapper.text()).toMatch('12345') // [ログイン中]お知らせの未読数
      expect(wrapper.text()).toMatch('user1の氏名') // [ログイン中]ユーザーの氏名
    } else {
      expect(wrapper.text()).not.toMatch('12345')
      expect(wrapper.text()).not.toMatch('user1の氏名')
    }
    expect(wrapper.find('#user_image').exists()).toBe(loggedIn) // [ログイン中]ユーザーの画像
  }

  // テストケース
  it('[未ログイン]表示される', () => {
    const wrapper = mountFunction(false, {})
    viewTest(wrapper, false)
  })
  it('[ログイン中]表示される', async () => {
    const user = Object.freeze({
      name: 'user1の氏名',
      image_url: {
        small: 'https://example.com/images/user/small_noimage.jpg'
      },
      infomation_unread_count: 12345
    })
    const wrapper = mountFunction(true, user)

    // ユーザー名クリック時のメニュー表示
    const button = wrapper.find('#user_menu_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')

    await helper.sleep(1)
    viewTest(wrapper, true)
  })
})
