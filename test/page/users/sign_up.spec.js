import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Page from '~/pages/users/sign_up.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('sign_up.vue', () => {
  let axiosPostMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (loggedIn, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Page, {
      localVue,
      vuetify,
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          singUpUrl: '/users/auth/sign_up.json',
          frontBaseURL: 'https://front.example.com',
          singUpSuccessUrl: '/users/sign_in'
        },
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        },
        $router: {
          push: routerPushMock
        }
      },
      data () {
        return { ...values }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonMessageTest = (wrapper, alert, notice) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(alert)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(notice)
  }
  const commonViewTest = (wrapper) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(false)
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    commonMessageTest(wrapper, null, null)
    expect(wrapper.findComponent(ActionLink).exists()).toBe(true)
    expect(wrapper.findComponent(ActionLink).vm.$props.action).toBe('sign_up')

    expect(wrapper.vm.$data.name).toBe('')
    expect(wrapper.vm.$data.email).toBe('')
    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
  }
  const commonToastedTest = (alert, notice) => {
    expect(toastedErrorMock).toBeCalledTimes(alert !== null ? 1 : 0)
    if (alert !== null) {
      expect(toastedErrorMock).toBeCalledWith(alert)
    }
    expect(toastedInfoMock).toBeCalledTimes(notice !== null ? 1 : 0)
    if (notice !== null) {
      expect(toastedInfoMock).toBeCalledWith(notice)
    }
  }
  const commonRedirectTest = (alert, notice, url) => {
    commonToastedTest(alert, notice)
    expect(routerPushMock).toBeCalledTimes(1)
    expect(routerPushMock).toBeCalledWith(url)
  }
  const commonApiCalledTest = (values) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/sign_up.json', {
      name: values.name,
      email: values.email,
      password: values.password,
      password_confirmation: values.password_confirmation,
      confirm_success_url: 'https://front.example.com/users/sign_in'
    })
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('[???????????????]???????????????', async () => {
    const wrapper = mountFunction(false)
    commonViewTest(wrapper)

    // ???????????????
    const button = wrapper.find('#sign_up_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // ??????

    // ??????
    wrapper.vm.$data.name = 'user1?????????'
    wrapper.vm.$data.email = 'user1@example.com'
    wrapper.vm.$data.password = 'abc12345'
    wrapper.vm.$data.password_confirmation = 'abc12345'

    // ???????????????
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (!button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(false) // ??????
  })
  it('[???????????????]????????????????????????????????????????????????', () => {
    mountFunction(true)
    commonRedirectTest(null, locales.auth.already_authenticated, { path: '/' })
  })

  describe('?????????????????????API', () => {
    const data = Object.freeze({ alert: 'alert???????????????', notice: 'notice???????????????' })
    const values = Object.freeze({ name: 'user1?????????', email: 'user1@example.com', password: 'abc12345', password_confirmation: 'abc12345' })
    it('[??????]???????????????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { email: ['error???????????????'] } }, data) } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
    })

    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[????????????????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(false, values)
      const button = wrapper.find('#sign_up_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
