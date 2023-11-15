import { mount } from '@vue/test-utils'
import Component from '~/components/spaces/Icon.vue'
import { detail, detailDestroy } from '~/test/data/spaces'

describe('Icon.vue', () => {
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
  const viewTest = (wrapper: any, space: any, visible: boolean) => {
    expect(wrapper.find(`#space_icon_private_${space.code}`).exists()).toBe(visible) // 非公開
    expect(wrapper.find(`#space_icon_power_${space.code}`).exists()).toBe(visible) // 権限
    expect(wrapper.find(`#space_icon_destroy_schedule_${space.code}`).exists()).toBe(visible) // 削除予定
  }

  // テストケース
  it('[未参加スペース]表示されない', () => {
    const space = Object.freeze({
      ...detail,
      private: false
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, false)
  })
  it('[参加スペース]表示される', () => {
    const space = Object.freeze({
      ...detailDestroy.value('admin'),
      private: true
    })
    const wrapper = mountFunction(space)
    viewTest(wrapper, space, true)
  })
})
