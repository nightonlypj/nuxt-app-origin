import { mount } from '@vue/test-utils'
// import flushPromises from 'flush-promises'
import helper from '~/test/helper'
import Component from '~/components/app/Message.vue'

describe('Message.vue', () => {
  const mountFunction = (messages: any) => {
    const wrapper = mount(Component, {
      props: {
        messages
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, message: string) => {
    expect(wrapper.text()).toMatch(message)
  }

  // テストケース
  const alert = 'alertメッセージ'
  const notice = 'noticeメッセージ'
  it('[alert/noticeなし]表示されない', () => {
    const wrapper = mountFunction({})
    helper.blankTest(wrapper)
  })
  it('[alertなし/noticeあり]表示される', () => {
    const wrapper = mountFunction({ notice })
    viewTest(wrapper, notice)
  })
  it('[alertあり/noticeなし]表示される', () => {
    const wrapper = mountFunction({ alert })
    viewTest(wrapper, alert)
  })
  it('[alert/noticeあり]表示される', () => {
    const wrapper = mountFunction({ alert, notice })
    viewTest(wrapper, alert)
    viewTest(wrapper, notice)
  })

  describe('閉じる', () => {
    it('[alert]値が削除される', () => {
      const wrapper: any = mountFunction({ alert, notice })
      // const message = wrapper.find('#message_alert')
      // message.trigger('click:close')
      // await flushPromises()
      wrapper.vm.close('alert') // NOTE: triggerが動かない為、直接呼び出す

      expect(wrapper.emitted()['update:messages']).toEqual([[{ alert: '', notice }]])
    })
    it('[notice]値が削除される', () => {
      const wrapper: any = mountFunction({ alert, notice })
      // const message = wrapper.find('#message_notice')
      // message.trigger('click:close')
      // await flushPromises()
      wrapper.vm.close('notice') // NOTE: triggerが動かない為、直接呼び出す

      expect(wrapper.emitted()['update:messages']).toEqual([[{ alert, notice: '' }]])
    })
  })
})
