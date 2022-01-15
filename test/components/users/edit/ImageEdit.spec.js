import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
// import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/ImageEdit.vue'

describe('ImageEdit.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (uploadImage) => {
    return mount(Component, {
      localVue,
      vuetify,
      mocks: {
        $auth: {
          user: {
            image_url: {
              xlarge: 'https://example.com/images/user/xlarge_noimage.jpg'
            },
            upload_image: uploadImage
          }
        }
      }
    })
  }

  const commonViewTest = (uploadImage) => {
    const wrapper = mountFunction(uploadImage)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBe(null)

    const imageDelete = wrapper.find('#image_delete')
    expect(imageDelete.exists()).toBe(true)
    expect(imageDelete.vm.disabled).toBe(!uploadImage) // [デフォルト画像]画像削除ボタンが無効
  }

  it('[デフォルト画像]表示される', () => {
    commonViewTest(false)
  })
  it('[アップロード画像]表示される', () => {
    commonViewTest(true)
  })

  // TODO: onUserImageUpdate, onUserImageDelete
})
