import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SpacesCreate from '~/components/spaces/Create.vue'
import Component from '~/components/index/Space.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Space.vue', () => {
  const user = Object.freeze({
    spaces: [
      {
        code: 'code0001',
        image_url: {
          mini: 'https://example.com/images/space/mini_noimage.jpg'
        },
        name: 'スペース1'
      },
      {
        code: 'code0002',
        name: 'スペース2'
      }
    ]
  })
  const mountFunction = () => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        SpacesCreate: true
      },
      mocks: {
        $auth: {
          user: { ...user }
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper) => {
    expect(wrapper.findComponent(SpacesCreate).exists()).toBe(true) // スペース作成

    const links = helper.getLinks(wrapper)
    for (const space of user.spaces) { // 参加スペース
      expect(links.includes(`/-/${space.code}`)).toBe(true)
      expect(wrapper.find(`#space_link_${space.code}`).exists()).toBe(true)
      expect(wrapper.find(`#space_image_${space.code}`).exists()).toBe(space.image_url != null)
      expect(wrapper.html()).toMatch(space.name)
    }
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction()
    viewTest(wrapper)
  })
})
