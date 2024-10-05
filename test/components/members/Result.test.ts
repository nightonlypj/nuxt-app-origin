import { config, mount } from '@vue/test-utils'
import Component from '~/components/members/Result.vue'
import { createResult } from '~/test/data/members'

const $t = config.global.mocks.$t

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
    expect(wrapper.text()).toMatch($t(`{total}名中（${result.email.count <= 1 ? '単数' : '複数'}）`, { total: result.email.count }))
    expect(wrapper.text()).toMatch($t(`{total}名（${result.email.create_count <= 1 ? '単数' : '複数'}）`, { total: result.email.create_count }))
    expect(wrapper.text()).toMatch($t(`{total}名（${result.email.exist_count <= 1 ? '単数' : '複数'}）`, { total: result.email.exist_count }))
    expect(wrapper.text()).toMatch($t(`{total}名（${result.email.notfound_count <= 1 ? '単数' : '複数'}）`, { total: result.email.notfound_count }))

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
