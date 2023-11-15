import { mount } from '@vue/test-utils'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Component from '~/components/spaces/Title.vue'
import { detail } from '~/test/data/spaces'

describe('Title.vue', () => {
  const mountFunction = (space: object) => {
    const wrapper = mount(Component, {
      global: {
        stubs: {
          SpacesIcon: true
        }
      },
      props: {
        space
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, space: any) => {
    expect(wrapper.find(`#space_image_${space.code}`).exists()).toBe(space.image_url != null)
    expect(wrapper.html()).toMatch(`"/-/${space.code}"`) // スペーストップ
    expect(wrapper.text()).toMatch(space.name)

    const spacesIcon = wrapper.findComponent(SpacesIcon)
    expect(spacesIcon.vm.space).toEqual(space)
  }

  // テストケース
  it('表示される', () => {
    const wrapper = mountFunction(detail)
    viewTest(wrapper, detail)
  })
})
