import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import GoTop from '@inotom/vue-go-top'
import DestroyInfo from '~/components/DestroyInfo.vue'
import Layout from '~/layouts/default.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('default.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (loggedIn) => {
    return mount(Layout, {
      localVue,
      vuetify,
      stubs: {
        GoTop: true,
        Nuxt: true
      },
      mocks: {
        $config: {
          envName: ''
        },
        $auth: {
          loggedIn,
          user: {
            name: 'user1の氏名',
            image_url: {
              small: 'https://example.com/images/user/small_noimage.jpg'
            },
            infomation_unread_count: 12345
          }
        }
      }
    })
  }

  const commonViewTest = (loggedIn) => {
    const wrapper = mountFunction(loggedIn)
    expect(wrapper.vm).toBeTruthy()

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
    expect(links.includes('/users/edit')).toBe(loggedIn) // [ログイン中]登録情報変更
    expect(links.includes('/users/sign_out')).toBe(loggedIn) // [ログイン中]ログアウト

    // console.log(wrapper.text())
    if (loggedIn) {
      expect(wrapper.text()).toMatch('12345') // [ログイン中]お知らせの未読数
      expect(wrapper.text()).toMatch('user1の氏名') // [ログイン中]ユーザーの氏名
    } else {
      expect(wrapper.text()).not.toMatch('12345')
      expect(wrapper.text()).not.toMatch('user1の氏名')
    }
    expect(wrapper.find('#user_image').exists()).toBe(loggedIn) // [ログイン中]ユーザーの画像
  }

  it('[未ログイン]表示される', () => {
    commonViewTest(false)
  })
  it('[ログイン中]表示される', () => {
    commonViewTest(true)
  })
})
