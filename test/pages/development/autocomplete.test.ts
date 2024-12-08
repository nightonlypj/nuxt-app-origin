import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import DevelopmentSuggest from '~/components/development/Suggest.vue'
import Page from '~/pages/development/autocomplete.vue'

describe('autocomplete.vue', () => {
  const mountFunction = () => {
    const wrapper = mount(Page, {
      global: {
        stubs: {
          DevelopmentSuggest: true
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  it('表示される', () => {
    const wrapper = mountFunction()
    helper.presentTest(wrapper)

    expect(wrapper.findComponent(DevelopmentSuggest).exists()).toBe(true)
  })
})
