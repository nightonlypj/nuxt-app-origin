import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/members/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  const user = Object.freeze({ code: 'code000000000000000000001' })
  const mountFunction = (members, currentMemberAdmin = false, showItems = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        OnlyIcon: true,
        UsersAvatar: true
      },
      propsData: {
        sortBy: 'invitationed_at',
        sortDesc: true,
        members,
        showItems,
        currentMemberAdmin
      },
      mocks: {
        $auth: {
          loggedIn: true,
          user
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, members, show) => {
    // ヘッダ
    expect(wrapper.text()).toMatch('メンバー')
    if (show.optional && show.admin) {
      expect(wrapper.text()).toMatch('メールアドレス')
    } else {
      expect(wrapper.text()).not.toMatch('メールアドレス')
    }
    if (show.optional) {
      expect(wrapper.text()).toMatch('権限')
    } else {
      expect(wrapper.text()).not.toMatch('権限')
    }
    if (show.optional && show.admin) {
      expect(wrapper.text()).toMatch('招待者')
    } else {
      expect(wrapper.text()).not.toMatch('招待者')
    }
    if (show.optional) {
      expect(wrapper.text()).toMatch('招待日時')
    } else {
      expect(wrapper.text()).not.toMatch('招待日時')
    }

    const onlyIcons = wrapper.findAllComponents(OnlyIcon)
    if (show.optional && show.admin) {
      expect(onlyIcons.length).toBe(2)
      for (let index = 0; index < onlyIcons.length; index++) {
        expect(onlyIcons.at(index).vm.$props.power).toBe('admin')
      }
    } else {
      expect(onlyIcons.length).toBe(0)
    }

    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    let index = 0
    for (const member of members) {
      // メンバー
      expect(usersAvatars.at(index).exists()).toBe(true)
      expect(usersAvatars.at(index).vm.$props.user).toEqual(member.user)
      index += 1
      // メールアドレス
      if (show.optional && show.admin) {
        expect(wrapper.text()).toMatch(member.user.email)
      } else {
        expect(wrapper.text()).not.toMatch(member.user.email)
      }
      // 権限
      if (show.optional) {
        expect(wrapper.find('#member_update_link_' + member.user.code).exists()).toBe(show.admin && member.user.code !== user.code)
        expect(wrapper.text()).toMatch(member.power_i18n)
      } else {
        expect(wrapper.find('#member_update_link_' + member.user.code).exists()).toBe(false)
        expect(wrapper.text()).not.toMatch(member.power_i18n)
      }
      // 招待者
      if (show.optional && show.admin) {
        expect(usersAvatars.at(index).exists()).toBe(true)
        expect(usersAvatars.at(index).vm.$props.user).toEqual(member.invitation_user || null)
        index += 1
      }
      // 招待日時
      if (member.invitationed_at != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat(member.invitationed_at, 'ja'))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.$timeFormat(member.invitationed_at, 'ja'))
        }
      }
    }
  }

  // テストケース
  it('[null]表示されない', () => {
    const wrapper = mountFunction(null)
    helper.blankTest(wrapper)
  })
  it('[0件]表示されない', () => {
    const wrapper = mountFunction([])
    helper.blankTest(wrapper)
  })
  describe('2件、表示項目', () => {
    const members = Object.freeze([
      {
        user: {
          code: 'code000000000000000000002',
          name: 'user2の氏名',
          email: 'user2@example.com'
        },
        power: 'writer',
        power_i18n: '投稿者',
        invitation_user: {
          name: 'user1の氏名'
        },
        invitationed_at: '2000-01-02T12:34:56+09:00'
      },
      {
        user: {
          code: 'code000000000000000000001',
          name: 'user1の氏名',
          email: 'user1@example.com'
        },
        power: 'admin',
        power_i18n: '管理者'
      }
    ])

    describe('未設定', () => {
      it('[管理者]全て表示される', () => {
        const wrapper = mountFunction(members, true, null)
        viewTest(wrapper, members, { optional: true, admin: true })
      })
      it('[管理者以外]管理者のみの項目以外が表示される', () => {
        const wrapper = mountFunction(members, false, null)
        viewTest(wrapper, members, { optional: true, admin: false })
      })
    })
    describe('全て選択', () => {
      const showItems = Object.freeze(['user.name', 'user.email', 'power', 'invitation_user.name', 'invitationed_at'])
      it('[管理者]全て表示される', () => {
        const wrapper = mountFunction(members, true, showItems)
        viewTest(wrapper, members, { optional: true, admin: true })
      })
      it('[管理者以外]管理者のみの項目以外が表示される', () => {
        const wrapper = mountFunction(members, false, showItems)
        viewTest(wrapper, members, { optional: true, admin: false })
      })
    })
    describe('全て未選択', () => {
      it('[管理者]必須項目のみ表示される', () => {
        const wrapper = mountFunction(members, true, [])
        viewTest(wrapper, members, { optional: false, admin: true })
      })
      it('[管理者以外]必須項目のみ表示される', () => {
        const wrapper = mountFunction(members, false, [])
        viewTest(wrapper, members, { optional: false, admin: false })
      })
    })
  })
})
