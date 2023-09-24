import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/users/ActionLink.vue'

describe('ActionLink.vue', () => {
  const mountFunction = (action: string) => {
    const wrapper = mount(Component, {
      props: {
        action
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, action: string) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/users/sign_in')).toBe(action !== 'sign_in') // ログイン
    expect(links.includes('/users/sign_up')).toBe(action !== 'sign_up') // アカウント登録
    expect(links.includes('/users/password/reset')).toBe(action !== 'password') // パスワード再設定
    expect(links.includes('/users/confirmation/resend')).toBe(action !== 'confirmation') // メールアドレス確認
    expect(links.includes('/users/unlock/resend')).toBe(action !== 'unlock') // アカウントロック解除
  }

  // テストケース
  it('[ログイン]表示される', () => {
    const wrapper = mountFunction('sign_in')
    viewTest(wrapper, 'sign_in')
  })
  it('[アカウント登録]表示される', () => {
    const wrapper = mountFunction('sign_up')
    viewTest(wrapper, 'sign_up')
  })
  it('[パスワード再設定]表示される', () => {
    const wrapper = mountFunction('password')
    viewTest(wrapper, 'password')
  })
  it('[メールアドレス確認]表示される', () => {
    const wrapper = mountFunction('confirmation')
    viewTest(wrapper, 'confirmation')
  })
  it('[アカウントロック解除]表示される', () => {
    const wrapper = mountFunction('unlock')
    viewTest(wrapper, 'unlock')
  })
})
