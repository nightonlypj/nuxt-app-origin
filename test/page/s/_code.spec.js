import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Page from '~/pages/s/_code.vue'

describe('_code.vue', () => {
  const mountFunction = (loggedIn) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
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
    // TODO
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
  // TODO
})
