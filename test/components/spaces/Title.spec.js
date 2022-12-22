import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Component from '~/components/spaces/Title.vue'

describe('Title.vue', () => {
  const mountFunction = (space, suffixTitle = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        SpacesIcon: true
      },
      propsData: {
        space,
        suffixTitle
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, space, suffixTitle) => {
    expect(wrapper.find(`#space_image_${space.code}`).exists()).toBe(space.image_url != null)
    expect(wrapper.html()).toMatch(`"/-/${space.code}"`) // スペーストップ
    expect(wrapper.text()).toMatch(space.name + suffixTitle)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.vm.space).toEqual(space)
  }

  // テストケース
  it('表示される', () => {
    const space = Object.freeze({
      code: 'code0001',
      name: 'スペース1',
      image_url: {
        small: 'https://example.com/images/space/small_noimage.jpg'
      }
    })
    const suffixTitle = 'のメンバー'
    const wrapper = mountFunction(space, suffixTitle)
    viewTest(wrapper, space, suffixTitle)
  })
})
