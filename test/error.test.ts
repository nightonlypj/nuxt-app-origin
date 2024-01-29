import { config, mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Layout from '~/error.vue'

const $t = config.global.mocks.$t

describe('error.vue', () => {
  const mountFunction = (statusCode: number, data = {}) => {
    const wrapper = mount(Layout, {
      props: {
        error: {
          statusCode,
          data
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, messages: any = null) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/')).toBe(true) // トップページ
    expect(wrapper.vm.alert).toBe(messages.alert)
    expect(wrapper.vm.notice).toBe(messages.notice)
  }

  // テストケース
  const alert = 'alertメッセージ'
  const notice = 'noticeメッセージ'
  describe('alert/noticeなし', () => {
    it('[404]表示される', () => {
      const wrapper = mountFunction(404)
      viewTest(wrapper, { alert: $t('system.notfound') })
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500)
      viewTest(wrapper, { alert: $t('system.default') })
    })
  })
  describe('alertなし/noticeあり', () => {
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, { notice })
      viewTest(wrapper, { alert: $t('system.notfound'), notice })
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, { notice })
      viewTest(wrapper, { alert: $t('system.default'), notice })
    })
  })
  describe('alertあり/noticeなし', () => {
    const data = Object.freeze({ alert })
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, data)
      viewTest(wrapper, data)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, data)
      viewTest(wrapper, data)
    })
  })
  describe('alert/noticeあり', () => {
    const data = Object.freeze({ alert, notice })
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, data)
      viewTest(wrapper, data)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, data)
      viewTest(wrapper, data)
    })
  })
})
