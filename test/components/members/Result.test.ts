import { mount } from '@vue/test-utils'
import Component from '~/components/members/Result.vue'
import { createResult } from '~/test/data/members'

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
    const wrapper = mountFunction(createResult)
    viewTest(wrapper, createResult)
  })
})
