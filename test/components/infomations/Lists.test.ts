import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Component from '~/components/infomations/Lists.vue'

describe('Lists.vue', () => {
  const mountFunction = (infomations: object | null) => {
    const wrapper = mount(Component, {
      global: {
        stubs: {
          InfomationsLabel: true
        }
      },
      props: {
        infomations
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, infomations: any) => {
    const labels = wrapper.findAllComponents(InfomationsLabel)
    const links = helper.getLinks(wrapper)
    for (const [index, infomation] of infomations.entries()) {
      expect(labels[index].exists()).toBe(true) // ラベル
      expect(labels[index].vm.$props.infomation).toEqual(infomation)
      expect(links.includes(`/infomations/${infomation.id}`)).toBe(infomation.body_present) // [本文あり]お知らせ詳細
      expect(wrapper.text()).toMatch(infomation.title) // タイトル
      if (infomation.summary != null) {
        expect(wrapper.text()).toMatch(infomation.summary) // 概要
      }
      expect(wrapper.text()).toMatch(wrapper.vm.$dateFormat('ja', infomation.started_at)) // 開始日
    }
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[0件]表示されない', () => {
    const wrapper = mountFunction([])
    helper.blankTest(wrapper)
  })
  it('[2件]表示される', () => {
    const infomations = Object.freeze([
      {
        id: 1,
        title: 'タイトル1',
        summary: '概要1',
        body_present: true,
        started_at: '2000-01-01T12:34:56+09:00'
      },
      {
        id: 2,
        title: 'タイトル2',
        summary: null,
        body_present: false,
        started_at: '2000-01-02T12:34:56+09:00'
      }
    ])
    const wrapper = mountFunction(infomations)
    viewTest(wrapper, infomations)
  })
})
