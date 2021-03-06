import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/InfoEdit.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('InfoEdit.vue', () => {
  let axiosPostMock, authSetUserMock, authLogoutMock, toastedErrorMock, toastedInfoMock, routerPushMock

  beforeEach(() => {
    axiosPostMock = null
    authSetUserMock = jest.fn()
    authLogoutMock = jest.fn()
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
    routerPushMock = jest.fn()
  })

  const mountFunction = (user, values = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        user: { ...user }
      },
      mocks: {
        $config: {
          apiBaseURL: 'https://example.com',
          userUpdateUrl: '/users/auth/update.json',
          frontBaseURL: 'https://front.example.com',
          confirmationSuccessUrl: '/users/sign_in'
        },
        $axios: {
          post: axiosPostMock
        },
        $auth: {
          loggedIn: true,
          setUser: authSetUserMock,
          logout: authLogoutMock
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
    expect(wrapper.emitted().alert).toEqual([[alert]])
    expect(wrapper.emitted().notice).toEqual([[notice]])
  }
  const commonViewTest = (wrapper, user) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.name).toBe(user.name)
    expect(wrapper.vm.$data.email).toBe(user.email)
    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
    expect(wrapper.vm.$data.current_password).toBe('')
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
  const commonApiCalledTest = (values, setUserCalled, logoutCalled) => {
    expect(axiosPostMock).toBeCalledTimes(1)
    expect(axiosPostMock).toBeCalledWith('https://example.com/users/auth/update.json', {
      name: values.name,
      email: values.email,
      password: values.password,
      password_confirmation: values.password_confirmation,
      current_password: values.current_password,
      confirm_redirect_url: 'https://front.example.com/users/sign_in'
    })
    expect(authSetUserMock).toBeCalledTimes(setUserCalled)
    expect(authLogoutMock).toBeCalledTimes(logoutCalled)
  }
  const commonDisabledTest = (wrapper, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }

  it('???????????????', async () => {
    const user = Object.freeze({ name: 'user1?????????', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    const wrapper = mountFunction(user)
    commonViewTest(wrapper, user)

    // ???????????????
    const button = wrapper.find('#user_update_btn')
    expect(button.exists()).toBe(true)
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(true) // ??????

    // ??????
    wrapper.vm.$data.current_password = 'abc12345'

    // ???????????????
    for (let i = 0; i < 100; i++) {
      await helper.sleep(10)
      if (!button.vm.disabled) { break }
    }
    expect(button.vm.disabled).toBe(false) // ??????
  })

  describe('??????????????????API', () => {
    const data = Object.freeze({ alert: 'alert???????????????', notice: 'notice???????????????' })
    const user = Object.freeze({ name: 'user1?????????', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    const values = Object.freeze({ name: 'update?????????', email: 'update@example.com', password: 'update12345', password_confirmation: 'update12345', current_password: 'abc12345' })
    it('[??????]????????????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 1, 0)
      commonRedirectTest(data.alert, data.notice, { path: '/' })
    })
    it('[??????]????????????????????????????????????????????????????????????????????????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')
      wrapper.vm.$auth.loggedIn = false // Tips: ???????????????Mock??????????????????????????????

      await helper.sleep(1)
      commonApiCalledTest(values, 1, 0)
      commonRedirectTest(null, null, { path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: { password: ['error???????????????'] } }, data) } }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, true)
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 422, data: Object.assign({ errors: null }, data) } }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 0)
      commonMessageTest(wrapper, data.alert, data.notice)
      commonDisabledTest(wrapper, button, false)
    })

    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: null }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 0)
      commonToastedTest(locales.network.failure, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[???????????????]????????????????????????????????????????????????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 401 } }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 1)
      commonToastedTest(null, locales.auth.unauthenticated)
      // Tips: ?????????????????????????????????????????????????????????Mock??????????????????????????????
    })
    it('[????????????????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.reject({ response: { status: 500 } }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 0)
      commonToastedTest(locales.network.error, null)
      commonDisabledTest(wrapper, button, false)
    })
    it('[???????????????]??????????????????????????????????????????', async () => {
      axiosPostMock = jest.fn(() => Promise.resolve({ data: null }))
      const wrapper = mountFunction(user, values)
      const button = wrapper.find('#user_update_btn')
      button.trigger('click')

      await helper.sleep(1)
      commonApiCalledTest(values, 0, 0)
      commonToastedTest(locales.system.error, null)
      commonDisabledTest(wrapper, button, false)
    })
  })
})
