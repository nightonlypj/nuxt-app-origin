import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
// import locales from '~/locales/ja.js'
import Processing from '~/components/Processing.vue'
import Component from '~/components/users/edit/InfoEdit.vue'

describe('InfoEdit.vue', () => {
  const localVue = createLocalVue()
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
  })

  const mountFunction = (user) => {
    return mount(Component, {
      localVue,
      vuetify,
      propsData: {
        user
      }
    })
  }

  it('表示される', () => {
    const user = { name: 'user1の氏名', email: 'user1@example.com', unconfirmed_email: 'new@example.com' }
    const wrapper = mountFunction(user)
    expect(wrapper.vm).toBeTruthy()

    // console.log(wrapper.html())
    expect(wrapper.findComponent(Processing).exists()).toBe(false)
    expect(wrapper.vm.$data.name).toBe(user.name)
    expect(wrapper.vm.$data.email).toBe(user.email)
    expect(wrapper.vm.$data.password).toBe('')
    expect(wrapper.vm.$data.password_confirmation).toBe('')
    expect(wrapper.vm.$data.current_password).toBe('')
  })

  // TODO: onUserUpdate
})
