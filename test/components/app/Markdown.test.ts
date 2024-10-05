import { mount } from '@vue/test-utils'
import Component from '~/components/app/Markdown.vue'

describe('Markdown.vue', () => {
  const mountFunction = (props = {}) => {
    const wrapper = mount(Component, {
      props
    })
    expect(wrapper.vm).toBeTruthy()
    return wrapper
  }

  // テスト内容
  const viewTest = (wrapper: any, data: string) => {
    expect(wrapper.html()).toMatch(data)
  }

  // テストケース
  it('[sourceがない]表示されない', () => {
    const wrapper = mountFunction({})
    viewTest(wrapper, '<!--v-if-->')
  })
  it('[sourceがある]表示される', () => {
    const wrapper = mountFunction({ source: '# test' })
    viewTest(wrapper, '<h1>test</h1>')
  })
  it('[sourceがある(highlight)]表示される', () => {
    const wrapper = mountFunction({ source: '```js\ntest\n```\n' })
    viewTest(wrapper, '<pre><code class="language-js">test\n</code></pre>')
  })
})
