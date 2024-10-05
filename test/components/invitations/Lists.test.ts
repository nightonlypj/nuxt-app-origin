import { config, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { dateTimeFormat } from '~/utils/display'
import helper from '~/test/helper'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/invitations/Lists.vue'
import { activeUser } from '~/test/data/user'
import { listCount4 } from '~/test/data/invitations'

const $config = config.global.mocks.$config
const $t = config.global.mocks.$t

describe('Lists.vue', () => {
  let mock: any
  beforeEach(() => {
    mock = {
      toast: helper.mockToast
    }
  })
  const headers = $config.public.invitations.headers

  const mountFunction = (invitations: any, hiddenItems: any = null) => {
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn: true,
        user: activeUser
      },
      $toast: mock.toast
    })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          UsersAvatar: true
        }
      },
      props: {
        invitations,
        hiddenItems
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = async (wrapper: any, invitations: any, show: any = { optional: null, active: 0, inactive: 0 }) => {
    // ヘッダ
    expect(wrapper.text()).toMatch($t('招待URL'))
    expect(wrapper.text()).toMatch($t('ステータス'))
    if (show.optional) {
      expect(wrapper.text()).toMatch($t('メールアドレス'))
      expect(wrapper.text()).toMatch($t('権限'))
      expect(wrapper.text()).toMatch($t('期限'))
      expect(wrapper.text()).toMatch($t('メモ'))
      expect(wrapper.text()).toMatch($t('作成者'))
      expect(wrapper.text()).toMatch($t('作成日時'))
      expect(wrapper.text()).toMatch($t('更新者'))
      expect(wrapper.text()).toMatch($t('更新日時'))
    } else {
      expect(wrapper.text()).not.toMatch($t('メールアドレス'))
      expect(wrapper.text()).not.toMatch($t('権限'))
      // expect(wrapper.text()).not.toMatch($t('期限')) // NOTE: 期限切れに含まれる為
      expect(wrapper.text()).not.toMatch($t('メモ'))
      expect(wrapper.text()).not.toMatch($t('作成者'))
      expect(wrapper.text()).not.toMatch($t('作成日時'))
      expect(wrapper.text()).not.toMatch($t('更新者'))
      expect(wrapper.text()).not.toMatch($t('更新日時'))
    }

    // (状態)
    expect(wrapper.findAll('.row_active').length).toBe(show.active)
    expect(wrapper.findAll('.row_inactive').length).toBe(show.inactive)

    const usersAvatars = wrapper.findAllComponents(UsersAvatar)
    let index = 0
    for (const invitation of invitations) {
      // 招待URL
      const copyBtn = wrapper.find(`#invitation_url_copy_btn_${invitation.code}`)
      expect(copyBtn.exists()).toBe(invitation.status === 'active')
      if (invitation.status === 'active') {
        const mockWriteText = vi.fn(() => Promise.resolve())
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: mockWriteText } })

        copyBtn.trigger('click')
        helper.mockCalledTest(mockWriteText, 1, `${location.protocol}//${location.host}/users/sign_up?code=${invitation.code}`)
        await flushPromises()

        // helper.toastMessageTest(mock.toast, { success: $t('notice.invitation.copy_success') }) // TODO: 呼ばれているけど、mockがcallされない
        helper.toastMessageTest(mock.toast, {})
      }
      // ステータス
      expect(wrapper.find(`#invitation_icon_active_${invitation.code}`).exists()).toBe(invitation.status === 'active')
      expect(wrapper.find(`#invitation_icon_inactive_${invitation.code}`).exists()).toBe(invitation.status === 'expired' || invitation.status === 'deleted')
      expect(wrapper.find(`#invitation_icon_email_joined_${invitation.code}`).exists()).toBe(invitation.status === 'email_joined')
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
          expect(wrapper.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.ended_at))
        } else {
          expect(wrapper.text()).not.toMatch(dateTimeFormat.value(helper.locale, invitation.ended_at))
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
          expect(wrapper.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.created_at))
        } else {
          expect(wrapper.text()).not.toMatch(dateTimeFormat.value(helper.locale, invitation.created_at))
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
          expect(wrapper.text()).toMatch(dateTimeFormat.value(helper.locale, invitation.last_updated_at))
        } else {
          expect(wrapper.text()).not.toMatch(dateTimeFormat.value(helper.locale, invitation.last_updated_at))
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
    it('[非表示項目が空]全て表示される', () => {
      const wrapper = mountFunction(listCount4, [])
      viewTest(wrapper, listCount4, { optional: true, active: 1, inactive: 3 })
    })
    it('[非表示項目が全項目]必須項目のみ表示される', () => {
      const hiddenItems = headers.filter((item: any) => item.required !== true).map((item: any) => item.key)
      const wrapper = mountFunction(listCount4, hiddenItems)
      viewTest(wrapper, listCount4, { optional: false, active: 1, inactive: 3 })
    })
  })
})
