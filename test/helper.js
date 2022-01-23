import { RouterLinkStub } from '@vue/test-utils'

export class Helper {
  // 一定時間停止
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  // NuxtLinkのURL一覧を配列で返却
  getLinks = (wrapper) => {
    const routerlinks = wrapper.findAllComponents(RouterLinkStub)
    const links = []
    for (let i = 0; i < routerlinks.length; i++) {
      const link = routerlinks.at(i).props().to
      if (link.name === 'infomations-id___ja') {
        links.push('/infomations/' + link.params.id) // お知らせ一覧
      } else {
        links.push(link)
      }
    }
    return links
  }
}
