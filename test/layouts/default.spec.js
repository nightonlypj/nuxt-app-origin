import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import GoTop from '@inotom/vue-go-top'
import DestroyInfo from '~/components/DestroyInfo.vue'
import Layout from '~/layouts/default.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('default.vue', () => {
  const mountFunction = (loggedIn, user = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Layout, {
      localVue,
      vuetify,
      stubs: {
        GoTop: true,
        DestroyInfo: true,
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
  const viewTest = (wrapper, loggedIn, user = {}) => {
    expect(wrapper.findComponent(GoTop).exists()).toBe(true) // 上に戻る
    expect(wrapper.findComponent(DestroyInfo).exists()).toBe(true) // アカウント削除予約
    expect(wrapper.html()).toMatch('<nuxt-stub></nuxt-stub>')

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
      expect(wrapper.text()).toMatch('12345') // お知らせの未読数
      expect(wrapper.text()).toMatch('67890') // 未ダウンロード数
      for (const space of user.spaces) { // 参加スペース
        expect(wrapper.find(`#space_link_${space.code}`).exists()).toBe(true)
        expect(wrapper.find(`#space_image_${space.code}`).exists()).toBe(space.image_url != null)
        expect(wrapper.html()).toMatch(space.name)
      }
    } else {
      expect(wrapper.text()).not.toMatch('user1の氏名')
      expect(wrapper.text()).not.toMatch('12345')
      expect(wrapper.text()).not.toMatch('67890')
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
      infomation_unread_count: 12345,
      undownloaded_count: 67890,
      spaces: [
        {
          code: 'code0001',
          image_url: {
            mini: 'https://example.com/images/space/mini_noimage.jpg'
          },
          name: 'スペース1'
        },
        {
          code: 'code0002',
          name: 'スペース2'
        }
      ]
    })
    const wrapper = mountFunction(true, user)

    // ユーザー名クリック時のメニュー表示
    const button = wrapper.find('#user_menu_btn')
    expect(button.exists()).toBe(true)
    button.trigger('click')
    await helper.sleep(1)

    viewTest(wrapper, true, user)
  })
})
