import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/invitations/Lists.vue'

import { Helper } from '~/test/helper.js'
const helper = new Helper()

describe('Lists.vue', () => {
  let toastedErrorMock, toastedInfoMock

  beforeEach(() => {
    toastedErrorMock = jest.fn()
    toastedInfoMock = jest.fn()
  })

  const user = Object.freeze({ code: 'code000000000000000000001' })
  const mountFunction = (invitations, hiddenItems = null) => {
    const localVue = createLocalVue()
    const vuetify = new Vuetify()
    const wrapper = mount(Component, {
      localVue,
      vuetify,
      stubs: {
        UsersAvatar: true
      },
      propsData: {
        invitations,
        hiddenItems
      },
      mocks: {
        $auth: {
          loggedIn: true,
          user
        },
        $toasted: {
          error: toastedErrorMock,
          info: toastedInfoMock
        }
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper, invitations, show = { optional: null }) => {
    // ヘッダ
    expect(wrapper.text()).toMatch('招待URL')
    expect(wrapper.text()).toMatch('ステータス')
    if (show.optional) {
      expect(wrapper.text()).toMatch('メールアドレス')
      expect(wrapper.text()).toMatch('権限')
      expect(wrapper.text()).toMatch('期限')
      expect(wrapper.text()).toMatch('メモ')
      expect(wrapper.text()).toMatch('作成者')
      expect(wrapper.text()).toMatch('作成日時')
      expect(wrapper.text()).toMatch('更新者')
      expect(wrapper.text()).toMatch('更新日時')
    } else {
      expect(wrapper.text()).not.toMatch('メールアドレス')
      expect(wrapper.text()).not.toMatch('権限')
      // expect(wrapper.text()).not.toMatch('期限') // NOTE: 期限切れに含まれる為
      expect(wrapper.text()).not.toMatch('メモ')
      expect(wrapper.text()).not.toMatch('作成者')
      expect(wrapper.text()).not.toMatch('作成日時')
      expect(wrapper.text()).not.toMatch('更新者')
      expect(wrapper.text()).not.toMatch('更新日時')
    }

    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    let index = 0
    for (const invitation of invitations) {
      // 招待URL
      const copyBtn = wrapper.find(`#invitation_url_copy_btn_${invitation.code}`)
      expect(copyBtn.exists()).toBe(invitation.status === 'active')
      if (invitation.status === 'active') {
        const writeTextMock = jest.fn(() => Promise.resolve())
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: writeTextMock } })
        copyBtn.trigger('click')
        helper.mockCalledTest(writeTextMock, 1, `${location.protocol}//${location.host}/users/sign_up?code=${invitation.code}`)
        helper.mockCalledTest(toastedErrorMock, 0)
        // helper.mockCalledTest(toastedInfoMock, 1, helper.locales.notice.invitation.copy_success) // NOTE: Jestだと呼ばれない？
      }
      // ステータス
      expect(wrapper.find(`#icon_active_${invitation.code}`).exists()).toBe(invitation.status === 'active')
      expect(wrapper.find(`#icon_inactive_${invitation.code}`).exists()).toBe(invitation.status === 'expired' || invitation.status === 'deleted')
      expect(wrapper.find(`#icon_email_joined_${invitation.code}`).exists()).toBe(invitation.status === 'email_joined')
      expect(wrapper.text()).toMatch(invitation.status_i18n)
      // メールアドレス
      if (invitation.email != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(invitation.email)
        } else {
          expect(wrapper.text()).not.toMatch(invitation.email)
        }
      } else {
        for (const domain of invitation.domains) {
          if (show.optional) {
            expect(wrapper.text()).toMatch(`*@${domain}`)
          } else {
            expect(wrapper.text()).not.toMatch(`*@${domain}`)
          }
        }
      }
      // 権限
      if (show.optional) {
        expect(wrapper.text()).toMatch(invitation.power_i18n)
      } else {
        expect(wrapper.text()).not.toMatch(invitation.power_i18n)
      }
      // 期限
      if (invitation.ended_at != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.ended_at))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.$timeFormat('ja', invitation.ended_at))
        }
      }
      // 作成者
      if (show.optional && invitation.created_user != null) {
        if (invitation.created_user.deleted) {
          expect(wrapper.text()).toMatch('N/A')
        } else {
          expect(usersAvatars.at(index).exists()).toBe(true)
          expect(usersAvatars.at(index).vm.$props.user).toEqual(invitation.created_user)
          index += 1
        }
      }
      // 作成日時
      if (invitation.created_at != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.created_at))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.$timeFormat('ja', invitation.created_at))
        }
      }
      // 更新者
      if (show.optional && invitation.last_updated_user != null) {
        if (invitation.last_updated_user.deleted) {
          expect(wrapper.text()).toMatch('N/A')
        } else {
          expect(usersAvatars.at(index).exists()).toBe(true)
          expect(usersAvatars.at(index).vm.$props.user).toEqual(invitation.last_updated_user)
          index += 1
        }
      }
      // 更新日時
      if (invitation.last_updated_at != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(wrapper.vm.$timeFormat('ja', invitation.last_updated_at))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.$timeFormat('ja', invitation.last_updated_at))
        }
      }
    }
    expect(usersAvatars.length).toBe(index)
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
  describe('4件', () => {
    const invitations = Object.freeze([
      {
        status: 'email_joined',
        status_i18n: '参加済み',
        code: 'invitation000000000000004',
        email: 'user1@example.com',
        power: 'admin',
        power_i18n: '管理者',
        email_joined_at: '2000-04-02T12:34:56+09:00',
        created_user: {
          name: 'user4の氏名'
        },
        created_at: '2000-04-01T12:34:56+09:00'
      },
      {
        status: 'deleted',
        status_i18n: '削除済み',
        code: 'invitation000000000000003',
        domains: ['d.example.com'],
        power: 'reader',
        power_i18n: '閲覧者',
        memo: 'メモ3',
        destroy_requested_at: '2000-03-02T12:34:56+09:00',
        destroy_schedule_at: '2000-03-09T12:34:56+09:00',
        created_user: {
          deleted: true
        },
        last_updated_user: {
          deleted: true
        },
        created_at: '2000-03-01T12:34:56+09:00',
        last_updated_at: '2000-03-03T12:34:56+09:00'
      },
      {
        status: 'expired',
        status_i18n: '期限切れ',
        code: 'invitation000000000000002',
        domains: ['c.example.com'],
        power: 'writer',
        power_i18n: '投稿者',
        ended_at: '2000-02-31T12:34:56+09:00',
        created_user: {
          name: 'user2の氏名'
        },
        last_updated_user: {
          name: 'user3の氏名'
        },
        created_at: '2000-02-01T12:34:56+09:00',
        last_updated_at: '2000-02-02T12:34:56+09:00'
      },
      {
        status: 'active',
        status_i18n: '有効',
        code: 'invitation000000000000001',
        domains: ['a.example.com', 'b.example.com'],
        power: 'admin',
        power_i18n: '管理者',
        memo: 'メモ1',
        created_user: {
          name: 'user1の氏名'
        },
        created_at: '2000-01-01T12:34:56+09:00'
      }
    ])

    it('[非表示項目が空]全て表示される', () => {
      const wrapper = mountFunction(invitations, [])
      viewTest(wrapper, invitations, { optional: true })
    })
    it('[非表示項目が全項目]必須項目のみ表示される', () => {
      const hiddenItems = helper.locales.items.invitation.map(item => item.value)
      const wrapper = mountFunction(invitations, hiddenItems)
      viewTest(wrapper, invitations, { optional: false })
    })
  })
})
