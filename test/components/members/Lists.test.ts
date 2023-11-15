import { mount } from '@vue/test-utils'
import helper from '~/test/helper'
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Component from '~/components/members/Lists.vue'
import { activeUser } from '~/test/data/user'
import { listCount3 } from '~/test/data/members'

describe('Lists.vue', () => {
  const mountFunction = (members: any, admin = false, hiddenItems: any = [], activeUserCodes: any = []) => {
    vi.stubGlobal('useNuxtApp', vi.fn(() => ({
      $auth: {
        loggedIn: true,
        user: activeUser
      }
    })))

    const wrapper = mount(Component, {
      global: {
        stubs: {
          OnlyIcon: true,
          UsersAvatar: true
        }
      },
      props: {
        sort: 'invitationed_at',
        desc: true,
        members,
        selectedMembers: [],
        hiddenItems,
        activeUserCodes,
        admin
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, members: any, show: any = { optional: null, admin: null }) => {
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
    if (show.optional && show.admin) {
      expect(wrapper.text()).toMatch('更新者')
      expect(wrapper.text()).toMatch('更新日時')
    } else {
      expect(wrapper.text()).not.toMatch('更新者')
      expect(wrapper.text()).not.toMatch('更新日時')
    }

    const onlyIcons = wrapper.findAllComponents(OnlyIcon)
    if (show.optional && show.admin) {
      expect(onlyIcons.length).toBe(4)
      for (let index = 0; index < onlyIcons.length; index++) {
        expect(onlyIcons.at(index).vm.$props.power).toBe('admin')
      }
    } else {
      expect(onlyIcons.length).toBe(0)
    }

    // (状態)
    /* TODO: 背景色が変わらない
    expect(wrapper.findAll('.row_active').length).toBe(row.active)
    expect(wrapper.findAll('.row_inactive').length).toBe(row.inactive)
    */

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
        expect(wrapper.find(`#member_update_link_${member.user.code}`).exists()).toBe(show.admin && member.user.code !== activeUser.code)
        expect(wrapper.text()).toMatch(member.power_i18n)
      } else {
        expect(wrapper.find(`#member_update_link_${member.user.code}`).exists()).toBe(false)
        expect(wrapper.text()).not.toMatch(member.power_i18n)
      }
      // 招待者
      if (show.optional && show.admin && member.invitationed_user != null) {
        if (member.invitationed_user.deleted) {
          expect(wrapper.text()).toMatch('N/A')
        } else {
          expect(usersAvatars.at(index).exists()).toBe(true)
          expect(usersAvatars.at(index).vm.$props.user).toEqual(member.invitationed_user)
          index += 1
        }
      }
      // 招待日時
      if (member.invitationed_at != null) {
        if (show.optional) {
          expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', member.invitationed_at))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.dateTimeFormat('ja', member.invitationed_at))
        }
      }
      // 更新者
      if (show.optional && show.admin && member.last_updated_user != null) {
        if (member.last_updated_user.deleted) {
          expect(wrapper.text()).toMatch('N/A')
        } else {
          expect(usersAvatars.at(index).exists()).toBe(true)
          expect(usersAvatars.at(index).vm.$props.user).toEqual(member.last_updated_user)
          index += 1
        }
      }
      // 更新日時
      if (member.last_updated_at != null) {
        if (show.optional && show.admin) {
          expect(wrapper.text()).toMatch(wrapper.vm.dateTimeFormat('ja', member.last_updated_at))
        } else {
          expect(wrapper.text()).not.toMatch(wrapper.vm.dateTimeFormat('ja', member.last_updated_at))
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
  describe('3件', () => {
    describe('非表示項目が空', () => {
      it('[管理者]全て表示される', () => {
        const wrapper = mountFunction(listCount3, true, [], [listCount3[0].user.code])
        viewTest(wrapper, listCount3, { optional: true, admin: true })
      })
      it('[管理者以外]管理者のみの項目以外が表示される', () => {
        const wrapper = mountFunction(listCount3, false, [])
        viewTest(wrapper, listCount3, { optional: true, admin: false })
      })
    })
    describe('非表示項目が全項目', () => {
      const hiddenItems = helper.locales.items.member.map(item => item.key)
      it('[管理者]必須項目のみ表示される', () => {
        const wrapper = mountFunction(listCount3, true, hiddenItems)
        viewTest(wrapper, listCount3, { optional: false, admin: true })
      })
      it('[管理者以外]必須項目のみ表示される', () => {
        const wrapper = mountFunction(listCount3, false, hiddenItems)
        viewTest(wrapper, listCount3, { optional: false, admin: false })
      })
    })

    describe('ソート', () => {
      it('選択値が設定される', () => {
        const wrapper: any = mountFunction(listCount3)
        const key = wrapper.vm.$props.sort
        const desc = wrapper.vm.$props.desc
        wrapper.vm.syncSortBy = [{ key, order: desc ? 'desc' : 'asc' }]
        expect(wrapper.emitted().reload[0]).toEqual([{ sort: key, desc }])

        // 同じ項目で並び順を2回変えると空になる
        wrapper.vm.syncSortBy = []
        expect(wrapper.emitted().reload[1]).toEqual([{ sort: key, desc: !desc }])
      })
    })

    describe('チェックボックス', () => {
      it('[管理者]表示される。選択項目が設定される', () => {
        const wrapper: any = mountFunction(listCount3, true)
        expect(wrapper.vm.headers.find((header: { key: string }) => header.key === 'data-table-select')).not.toBeUndefined()

        wrapper.vm.syncSelectedMembers = [listCount3[0]]
        expect(wrapper.emitted()['update:selectedMembers']).toEqual([[[listCount3[0]]]])
      })
      it('[管理者以外]表示されない', () => {
        const wrapper: any = mountFunction(listCount3, false)
        expect(wrapper.vm.headers.find((header: { key: string }) => header.key === 'data-table-select')).toBeUndefined()
      })
    })
  })
})
