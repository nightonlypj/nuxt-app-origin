import { createLocalVue, shallowMount } from '@vue/test-utils'
import { TestPlugin } from '~/plugins/utils.js'

describe('utils.js', () => {
  const localVue = createLocalVue()
  localVue.use(TestPlugin)

  const Plugin = {
    mounted () {
      this.dateFormat = this.$_dateFormat('2021-01-01T09:00:00+09:00', 'ja')
      this.timeFormat = this.$_timeFormat('2021-01-01T09:00:00+09:00', 'ja')
      const info = {
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        limit_value: 25
      }
      this.pageFirstNumber = this.$_pageFirstNumber(info)
      this.pageLastNumber = this.$_pageLastNumber(info)
    },
    template: '<div />'
  }

  it('成功', () => {
    const wrapper = shallowMount(Plugin, { localVue })
    expect(wrapper.vm.dateFormat).toBe('2021/01/01')
    expect(wrapper.vm.timeFormat).toBe('2021/01/01 09:00')
    expect(wrapper.vm.pageFirstNumber).toBe(1)
    expect(wrapper.vm.pageLastNumber).toBe(0)
  })
})
