import { RouterLinkStub } from '@vue/test-utils'

export class Helper {
  envConfig = require('~/config/test.js')
  commonConfig = require('~/config/common.js')
  locales = require('~/locales/ja.js')

  // 一定時間停止
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  // NuxtLinkのURL一覧を配列で返却
  getLinks = (wrapper) => {
    const links = []
    const routerlinks = wrapper.findAllComponents(RouterLinkStub)
    for (let index = 0; index < routerlinks.length; index++) {
      links.push(routerlinks.at(index).props().to)
    }
    return links
  }

  // テスト内容
  loadingTest = (wrapper, Loading) => {
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }

  blankTest = (wrapper, Loading = null) => {
    if (Loading != null) {
      expect(wrapper.findComponent(Loading).exists()).toBe(false)
    }
    expect(wrapper.html()).toBe('')
  }

  presentTest = (wrapper, Loading = null) => {
    if (Loading != null) {
      expect(wrapper.findComponent(Loading).exists()).toBe(false)
    }
    expect(wrapper.html()).not.toBe('')
  }

  mockCalledTest = (mock, count, arg = null) => {
    expect(mock).toBeCalledTimes(count)
    if (arg != null) {
      expect(mock).nthCalledWith(count, arg)
    }
  }

  messageTest = (wrapper, Message, data) => {
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(data?.alert || null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(data?.notice || null)
  }

  emitMessageTest = (wrapper, data) => {
    expect(wrapper.emitted().alert).toEqual([[data.alert]])
    expect(wrapper.emitted().notice).toEqual([[data.notice]])
  }

  disabledTest = async (wrapper, Processing, button, disabled) => {
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    await this.waitChangeDisabled(button, disabled)
    expect(button.vm.disabled).toBe(disabled)
  }

  // NOTE: 待ち時間を増やさないと状態が変わらない場合に使用
  waitChangeDisabled = async (button, disabled) => {
    for (let index = 0; index < 100; index++) {
      await this.sleep(1)
      if (button.vm.disabled === disabled) { break }
    }
  }
}
