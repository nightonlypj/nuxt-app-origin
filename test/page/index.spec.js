import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexInfomations from '~/components/index/Infomations.vue'
import Page from '~/pages/index.vue'

describe('index.vue', () => {
  const mountFunction = (loggedIn) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      stubs: {
        IndexSignUp: true,
        IndexInfomations: true
      },
      mocks: {
        $auth: {
          loggedIn
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, loggedIn) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(IndexSignUp).exists()).toBe(!loggedIn) // [未ログイン]アカウント登録
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
