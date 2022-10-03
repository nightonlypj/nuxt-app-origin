import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Component from '~/components/spaces/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  const mountFunction = (spaces, showItems = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        SpacesIcon: true
      },
      propsData: {
        spaces,
        showItems
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, spaces, show) => {
    const links = helper.getLinks(wrapper)
    const spacesIcons = wrapper.findAllComponents(SpacesIcon)
    for (const [index, space] of spaces.entries()) {
      // 名称
      expect(wrapper.find('#space_image_' + space.code).exists()).toBe(space.image_url != null)
      expect(links.includes('/s/' + space.code)).toBe(true) // スペース詳細
      expect(wrapper.text()).toMatch(space.name)
      expect(spacesIcons.at(index).exists()).toBe(true)
      expect(spacesIcons.at(index).vm.$props.space).toEqual(space)
      // 説明
      if (show.optional) {
        expect(wrapper.text()).toMatch(space.description)
      } else {
        expect(wrapper.text()).not.toMatch(space.description)
      }
      // メンバー一覧
      expect(links.includes('/members/' + space.code)).toBe(space.current_member != null)
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
  describe('2件、表示項目', () => {
    const spaces = Object.freeze([
      {
        code: 'code0001',
        image_url: {
          small: 'https://example.com/images/space/small_noimage.jpg'
        },
        name: '非公開スペース1',
        description: '非公開スペース1の説明',
        private: true,
        destroy_schedule_at: '2000-01-01T12:34:56+09:00',
        current_member: {
          power: 'admin',
          power_i18n: '管理者'
        }
      },
      {
        code: 'code0002',
        name: '公開スペース2',
        description: '公開スペース2の説明',
        private: false
      }
    ])

    it('[未設定]全て表示される', () => {
      const wrapper = mountFunction(spaces, null)
      viewTest(wrapper, spaces, { optional: true })
    })
    it('[全て選択]全て表示される', () => {
      const showItems = Object.freeze(['name', 'description', 'action'])
      const wrapper = mountFunction(spaces, showItems)
      viewTest(wrapper, spaces, { optional: true })
    })
    it('[全て未選択]必須項目のみ表示される', () => {
      const wrapper = mountFunction(spaces, [])
      viewTest(wrapper, spaces, { optional: false })
    })
  })
})
