import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Component from '~/components/spaces/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  const mountFunction = (spaces) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        SpacesIcon: true
      },
      propsData: {
        spaces
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, spaces) => {
    const links = helper.getLinks(wrapper)
    const spacesIcon = wrapper.findAllComponents(SpacesIcon)

    // console.log(links)
    // console.log(wrapper.text())
    for (const [index, space] of spaces.entries()) {
      expect(wrapper.find('#space_image_' + space.code).exists()).toBe(space.image_url != null) // 画像
      expect(links.includes('/spaces/' + space.code)).toBe(true) // スペース詳細
      expect(wrapper.text()).toMatch(space.name) // 名称
      expect(spacesIcon.at(index).exists()).toBe(true) // アイコン
      expect(spacesIcon.at(index).vm.$props.space).toEqual(space)
      expect(wrapper.text()).toMatch(space.description) // 説明
      expect(links.includes('/members/' + space.code)).toBe(space.current_member != null) // メンバー一覧
    }
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[0件]表示されない', () => {
    const spaces = Object.freeze([])
    const wrapper = mountFunction(spaces)
    helper.blankTest(wrapper)
  })
  it('[2件]表示される', () => {
    const spaces = Object.freeze([
      {
        code: 'code0001',
        image_url: {
          small: 'https://example.com/images/space/small_noimage.jpg'
        },
        name: '非公開スペース1',
        description: '非公開スペース1の説明',
        private: true,
        destroy_schedule_at: '2021-01-01T09:00:00+09:00',
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
    const wrapper = mountFunction(spaces)
    viewTest(wrapper, spaces)
  })
})
