import Vuetify from 'vuetify'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Component from '~/components/users/edit/ImageEdit.vue'

describe('ImageEdit.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (options) => {
    return shallowMount(Component, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          user: {
            image_url: {
              xlarge: 'https://example.com/images/user/xlarge_noimage.jpg'
            },
            upload_image: false
          }
        }
      },
      ...options
    })
  }

  it('成功', () => {
    const wrapper = mountFunction()
    // console.log(wrapper.html())
    expect(wrapper.vm).toBeTruthy()
  })
})
