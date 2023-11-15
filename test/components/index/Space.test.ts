import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import SpacesCreate from '~/components/spaces/Create.vue'
import Component from '~/components/index/Space.vue'
import { activeUser } from '~/test/data/user'
import { listMiniCount2 } from '~/test/data/spaces'

describe('Space.vue', () => {
  const mountFunction = (user: any) => {
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        user
      }
    })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          SpacesCreate: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, spaces: any) => {
    expect(wrapper.findComponent(SpacesCreate).exists()).toBe(true) // スペース作成

    const links = helper.getLinks(wrapper)
    for (const space of spaces) { // 参加スペース
      expect(links.includes(`/-/${space.code}`)).toBe(true)
      expect(wrapper.find(`#space_link_${space.code}`).exists()).toBe(true)
      expect(wrapper.find(`#space_image_${space.code}`).exists()).toBe(space.image_url != null)
      expect(wrapper.html()).toMatch(space.name)
    }
  }

  // テストケース
  it('[参加スペースあり]一覧が表示される', () => {
    const wrapper = mountFunction({ spaces: listMiniCount2 })
    viewTest(wrapper, listMiniCount2)
  })
  it('[参加スペースなし]メッセージが表示される', () => {
    const wrapper = mountFunction({ ...activeUser, spaces: [] })
    expect(wrapper.findComponent(SpacesCreate).exists()).toBe(true) // スペース作成
    expect(wrapper.text()).toMatch('新しいスペースを作成するか、参加したいスペースの管理者に連絡して追加して貰いましょう！')
  })
})
