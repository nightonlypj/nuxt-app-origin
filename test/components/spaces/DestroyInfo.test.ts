import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import Component from '~/components/spaces/DestroyInfo.vue'
import { detail, detailDestroy } from '~/test/data/spaces'

describe('DestroyInfo.vue', () => {
  const mountFunction = (space: object) => {
    const wrapper = mount(Component, {
      props: {
        space
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, space: any, link: boolean) => {
    expect(wrapper.text()).toMatch(wrapper.vm.dateFormat('ja', space.destroy_schedule_at)) // 削除予定日
    const links = helper.getLinks(wrapper)
    expect(links.includes(`/spaces/undo_delete/${space.code}`)).toBe(link) // スペース削除取り消し
  }

  // テストケース
  it('[削除予定なし]表示されない', () => {
    const wrapper = mountFunction(detail)
    helper.blankTest(wrapper)
  })
  it('[削除予定あり（管理者）]取り消しリンクも表示される', () => {
    const wrapper = mountFunction(detailDestroy.value('admin'))
    viewTest(wrapper, detailDestroy.value('admin'), true)
  })
  it('[削除予定あり（管理者以外）]取り消しリンクは表示されない', () => {
    const wrapper = mountFunction(detailDestroy.value('writer'))
    viewTest(wrapper, detailDestroy.value('writer'), false)
  })
})
