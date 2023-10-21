import { mount } from '@vue/test-utils'
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexSpace from '~/components/index/Space.vue'
import IndexPublicSpace from '~/components/index/PublicSpace.vue'
import IndexInfomations from '~/components/index/Infomations.vue'
import Page from '~/pages/index.vue'

describe('index.vue', () => {
  const mountFunction = (loggedIn: boolean) => {
    const wrapper = mount(Page, {
      global: {
        stubs: {
          IndexSignUp: true,
          IndexSpace: true,
          IndexPublicSpace: true,
          IndexInfomations: true
        },
        mocks: {
          $auth: {
            loggedIn
          }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, loggedIn: boolean) => {
    expect(wrapper.findComponent(IndexSignUp).exists()).toBe(!loggedIn) // [未ログイン]アカウント登録
    expect(wrapper.findComponent(IndexSpace).exists()).toBe(loggedIn) // [ログイン中]スペース
    expect(wrapper.findComponent(IndexPublicSpace).exists()).toBe(true) // 公開スペース
    expect(wrapper.findComponent(IndexInfomations).exists()).toBe(true) // 大切なお知らせ
  }

  // テストケース
  it('[未ログイン]表示される', () => {
    const wrapper = mountFunction(false)
    viewTest(wrapper, false)
  })
  it('[ログイン中]表示される', () => {
    const wrapper = mountFunction(true)
    viewTest(wrapper, true)
  })
})
