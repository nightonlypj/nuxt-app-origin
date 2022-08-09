import { RouterLinkStub } from '@vue/test-utils'

export class Helper {
  // 一定時間停止
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  // NuxtLinkのURL一覧を配列で返却
  getLinks = (wrapper) => {
    const routerlinks = wrapper.findAllComponents(RouterLinkStub)
    const links = []
    for (let i = 0; i < routerlinks.length; i++) {
      const link = routerlinks.at(i).props().to
      if (link.name === 'infomations-id___ja') {
        links.push('/infomations/' + link.params.id) // お知らせ一覧
      } else {
        links.push(link)
      }
    }
    return links
  }

  // テスト内容
  loadingTest = (wrapper, Loading) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Loading).exists()).toBe(true)
  }

  blankTest = (wrapper, Loading = null) => {
    // console.log(wrapper.html())
    if (Loading != null) {
      expect(wrapper.findComponent(Loading).exists()).toBe(false)
    }
    expect(wrapper.html()).toBe('')
  }

  presentTest = (wrapper, Loading = null) => {
    // console.log(wrapper.html())
    if (Loading != null) {
      expect(wrapper.findComponent(Loading).exists()).toBe(false)
    }
    expect(wrapper.html()).not.toBe('')
  }

  mockCalledTest = (mock, count, arg = null) => {
    expect(mock).toBeCalledTimes(count)
    if (arg != null) {
      expect(mock).nthCalledWith(1, arg)
    }
  }

  messageTest = (wrapper, Message, data) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Message).exists()).toBe(true)
    expect(wrapper.findComponent(Message).vm.$props.alert).toBe(data?.alert ?? null)
    expect(wrapper.findComponent(Message).vm.$props.notice).toBe(data?.notice ?? null)
  }

  emitMessageTest = (wrapper, data) => {
    // console.log(wrapper.emitted())
    expect(wrapper.emitted().alert).toEqual([[data.alert]])
    expect(wrapper.emitted().notice).toEqual([[data.notice]])
  }

  disabledTest = (wrapper, Processing, button, disabled) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(button.vm.disabled).toBe(disabled)
  }
}
