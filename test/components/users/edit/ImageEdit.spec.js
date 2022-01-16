import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
// import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/ImageEdit.vue'

describe('ImageEdit.vue', () => {
  const mountFunction = (uploadImage) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
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
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonViewTest = (wrapper, uploadImage) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.image).toBe(null)

    const imageDelete = wrapper.find('#image_delete')
    expect(imageDelete.exists()).toBe(true)
    expect(imageDelete.vm.disabled).toBe(!uploadImage) // [デフォルト画像]画像削除ボタンが無効
  }

  it('[デフォルト画像]表示される', () => {
    const wrapper = mountFunction(false)
    commonViewTest(wrapper, false)
  })
  it('[アップロード画像]表示される', () => {
    const wrapper = mountFunction(true)
    commonViewTest(wrapper, true)
  })

  // TODO: onUserImageUpdate, onUserImageDelete
})
