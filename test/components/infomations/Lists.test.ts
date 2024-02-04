import { mount } from '@vue/test-utils'
import { dateFormat } from '~/utils/display'
import helper from '~/test/helper'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Component from '~/components/infomations/Lists.vue'
import { listCount2 } from '~/test/data/infomations'

describe('Lists.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      navigateTo: vi.fn()
    }
  })

  const mountFunction = (infomations: any) => {
    vi.stubGlobal('navigateTo', mock.navigateTo)

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
      expect(wrapper.text()).toMatch(dateFormat.value(helper.locale, infomation.started_at)) // 開始日
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
  it('[2件]表示される。ダブルクリックで、本文ありは遷移し、本文なしは遷移しない', () => {
    const wrapper = mountFunction(listCount2)
    viewTest(wrapper, listCount2)

    // ダブルクリックで、本文ありは遷移する
    const bodyPresentList = wrapper.find(`#infomation_list_${listCount2[0].id}`)
    bodyPresentList.trigger('dblclick')
    helper.mockCalledTest(mock.navigateTo, 1, `/infomations/${listCount2[0].id}`)

    // ダブルクリックで、本文なしは遷移しない
    const bodyBlankList = wrapper.find(`#infomation_list_${listCount2[1].id}`)
    bodyBlankList.trigger('dblclick')
    expect(mock.navigateTo).toBeCalledTimes(1) // NOTE: 上で呼ばれている為
  })
})
