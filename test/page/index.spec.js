import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SignUp from '~/components/index/SignUp.vue'
import Infomations from '~/components/index/Infomations.vue'
import Page from '~/pages/index.vue'

describe('index.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (loggedIn) => {
    return mount(Page, {
      localVue,
      vuetify,
      stubs: {
        SignUp: true,
        Infomations: true
      },
      mocks: {
        $auth: {
          loggedIn
        }
      }
    })
  }

  const commonViewTest = (loggedIn) => {
    const wrapper = mountFunction(loggedIn)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(SignUp).exists()).toBe(!loggedIn) // [未ログイン]アカウント登録
    expect(wrapper.findComponent(Infomations).exists()).toBe(true) // 大切なお知らせ
  }

  it('[未ログイン]表示される', () => {
    commonViewTest(false)
  })
  it('[ログイン中]表示される', () => {
    commonViewTest(true)
  })
})
