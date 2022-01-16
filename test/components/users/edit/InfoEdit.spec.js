import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
// import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/InfoEdit.vue'

describe('InfoEdit.vue', () => {
  const mountFunction = (user) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      propsData: {
        user
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  const commonViewTest = (wrapper, name, email) => {
    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.name).toBe(name)
    expect(wrapper.vm.$data.email).toBe(email)
    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
    expect(wrapper.vm.$data.current_password).toBe('')
  }

  it('表示される', () => {
    const wrapper = mountFunction({ name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: 'new@example.com' })
    commonViewTest(wrapper, 'user1の氏名', 'user1@example.com')
  })

  // TODO: onUserUpdate
})
