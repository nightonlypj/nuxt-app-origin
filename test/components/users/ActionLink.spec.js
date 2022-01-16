import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import Component from '~/components/users/ActionLink.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('ActionLink.vue', () => {
  const mountFunction = (action) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        action
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonViewTest = (wrapper, action) => {
    const links = helper.getLinks(wrapper)

    // console.log(links)
    expect(links.includes('/users/sign_in')).toBe(action !== 'sign_in') // ログイン
    expect(links.includes('/users/sign_up')).toBe(action !== 'sign_up') // アカウント登録
    expect(links.includes('/users/password/new')).toBe(action !== 'password') // パスワード再設定
    expect(links.includes('/users/confirmation/new')).toBe(action !== 'confirmation') // メールアドレス確認
    expect(links.includes('/users/unlock/new')).toBe(action !== 'unlock') // アカウントロック解除
  }

  it('[ログイン]表示される', () => {
    const wrapper = mountFunction('sign_in')
    commonViewTest(wrapper, 'sign_in')
  })
  it('[アカウント登録]表示される', () => {
    const wrapper = mountFunction('sign_up')
    commonViewTest(wrapper, 'sign_up')
  })
  it('[パスワード再設定]表示される', () => {
    const wrapper = mountFunction('password')
    commonViewTest(wrapper, 'password')
  })
  it('[メールアドレス確認]表示される', () => {
    const wrapper = mountFunction('confirmation')
    commonViewTest(wrapper, 'confirmation')
  })
  it('[アカウントロック解除]表示される', () => {
    const wrapper = mountFunction('unlock')
    commonViewTest(wrapper, 'unlock')
  })
})
