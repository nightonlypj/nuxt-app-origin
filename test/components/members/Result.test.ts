import { mount } from '@vue/test-utils'
import Component from '~/components/members/Result.vue'

describe('Result.vue', () => {
  const mountFunction = (result: object) => {
    const wrapper = mount(Component, {
      props: {
        result
      }
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, result: any) => {
    expect(wrapper.text()).toMatch(`${result.email.count}名中`)
    expect(wrapper.text()).toMatch(`${result.email.create_count}名`)
    expect(wrapper.text()).toMatch(`${result.email.exist_count}名`)
    expect(wrapper.text()).toMatch(`${result.email.notfound_count}名`)

    for (const email of result.emails) {
      expect(wrapper.text()).toMatch(email.email) // メールアドレス
      expect(wrapper.text()).toMatch(email.result_i18n) // 結果
    }
  }

  // テストケース
  it('[空]N/Aが表示される', () => {
    const wrapper = mountFunction({})
    expect(wrapper.text()).toMatch('N/A')
    expect(wrapper.text()).toMatch('No data available')
  })
  it('[3件]表示される', () => {
    const result = Object.freeze({
      email: {
        count: 3,
        create_count: 1,
        exist_count: 2,
        notfound_count: 0
      },
      emails: [
        {
          email: 'user1@example.com',
          result: 'create',
          result_i18n: '招待しました。'
        },
        {
          email: 'user2@example.com',
          result: 'exist',
          result_i18n: '既に参加しています。'
        },
        {
          email: 'user3@example.com',
          result: 'notfound',
          result_i18n: 'アカウントが存在しません。登録後に招待してください。'
        }
      ]
    })
    const wrapper = mountFunction(result)
    viewTest(wrapper, result)
  })
})
