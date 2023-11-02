import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Layout from '~/error.vue'

describe('error.vue', () => {
  const mountFunction = (statusCode: number | null, data = {}) => {
    const wrapper = mount(Layout, {
      props: {
        error: {
          statusCode,
          ...data
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, data: any = null) => {
    const links = helper.getLinks(wrapper)
    expect(links.includes('/')).toBe(true) // トップページ
    expect(wrapper.vm.alert).toBe(data.alert)
    expect(wrapper.vm.notice).toBe(data.notice)
  }

  // テストケース
  describe('alert/noticeなし', () => {
    it('[404]表示される', () => {
      const wrapper = mountFunction(404)
      viewTest(wrapper, { alert: helper.locales.system.notfound })
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500)
      viewTest(wrapper, { alert: helper.locales.system.default })
    })
  })
  describe('alertなし/noticeあり', () => {
    const data = { notice: 'noticeメッセージ' }
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, { data })
      viewTest(wrapper, { alert: helper.locales.system.notfound, notice: data.notice })
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, { data })
      viewTest(wrapper, { alert: helper.locales.system.default, notice: data.notice })
    })
  })
  describe('alertあり/noticeなし', () => {
    const data = { alert: 'alertメッセージ' }
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, { data })
      viewTest(wrapper, data)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, { data })
      viewTest(wrapper, data)
    })
  })
  describe('alert/noticeあり', () => {
    const data = { alert: 'alertメッセージ', notice: 'noticeメッセージ' }
    it('[404]表示される', () => {
      const wrapper = mountFunction(404, { data })
      viewTest(wrapper, data)
    })
    it('[500]表示される', () => {
      const wrapper = mountFunction(500, { data })
      viewTest(wrapper, data)
    })
  })
})
