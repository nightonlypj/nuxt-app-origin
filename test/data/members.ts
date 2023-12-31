import helper from '~/test/helper'
import { detail as space } from '~/test/data/spaces'

const detail = Object.freeze({
  user: {
    code: 'code000000000000000000001',
    email: 'user1@example.com'
  },
  power: 'admin'
})

const listCount3 = Object.freeze([
  {
    user: {
      code: 'code000000000000000000003',
      name: 'user3の氏名',
      email: 'user3@example.com'
    },
    power: 'reader',
    power_i18n: '閲覧者',
    invitationed_user: {
      deleted: true
    },
    last_updated_user: {
      deleted: true
    },
    invitationed_at: '2000-03-01T12:34:56+09:00',
    last_updated_at: '2000-03-02T12:34:56+09:00'
  },
  {
    user: {
      code: 'code000000000000000000002',
      name: 'user2の氏名',
      email: 'user2@example.com'
    },
    power: 'writer',
    power_i18n: '投稿者',
    invitationed_user: {
      name: 'user1の氏名'
    },
    last_updated_user: {
      name: 'user2の氏名'
    },
    invitationed_at: '2000-02-01T12:34:56+09:00',
    last_updated_at: '2000-02-02T12:34:56+09:00'
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

const defaultPowers = []
const findPower: any = {}
const findPowers = []
let findPowerQuery = ''
let index = 0
for (const key in helper.locales.enums.member.power) {
  defaultPowers.push(key)
  findPower[key] = index % 2 === 0
  if (findPower[key]) { findPowers.push(key) }
  findPowerQuery += String(Number(findPower[key]))
  index++
}

const defaultParams = Object.freeze({
  text: '',
  power: defaultPowers.join(),
  active: 1,
  destroy: 1,
  sort: 'invitationed_at',
  desc: 1
})

const findParams = Object.freeze({
  text: 'aaa',
  power: findPowers.join(),
  active: 1,
  destroy: 1,
  sort: 'user.name',
  desc: 0
})
const findQuery = Object.freeze({
  ...findParams,
  power: findPowerQuery,
  active: String(findParams.active),
  destroy: String(findParams.destroy),
  desc: String(findParams.desc),
  option: '1'
})
const findData = Object.freeze({
  ...findParams,
  power: findPower,
  active: findParams.active === 1,
  destroy: findParams.destroy === 1,
  desc: findParams.desc !== 0,
  option: findQuery.option === '1'
})

const dataCount0 = Object.freeze({
  space,
  member: {
    total_count: 0,
    current_page: 1,
    total_pages: 0,
    limit_value: 2
  }
})
const dataCount1 = Object.freeze({
  space,
  member: {
    total_count: 1,
    current_page: 1,
    total_pages: 1,
    limit_value: 2
  },
  members: [
    { user: { code: 'code000000000000000000001' } }
  ]
})

const dataPage1 = Object.freeze({
  space,
  member: {
    total_count: 5,
    current_page: 1,
    total_pages: 3,
    limit_value: 2
  },
  members: [
    { user: { code: 'code000000000000000000001' } },
    { user: { code: 'code000000000000000000002' } }
  ]
})
const dataPage2 = Object.freeze({
  space,
  member: {
    total_count: 5,
    current_page: 2,
    total_pages: 3,
    limit_value: 2
  },
  members: [
    { user: { code: 'code000000000000000000003' } },
    { user: { code: 'code000000000000000000004' } }
  ]
})
const dataPage3 = Object.freeze({
  space,
  member: {
    total_count: 5,
    current_page: 3,
    total_pages: 3,
    limit_value: 2
  },
  members: [
    { user: { code: 'code000000000000000000005' } }
  ]
})

const dataPageTo2 = Object.freeze({
  ...dataPage2,
  members: dataPage1.members.concat(dataPage2.members)
})
const dataPageTo3 = Object.freeze({
  ...dataPage3,
  members: dataPageTo2.members.concat(dataPage3.members)
})

const dataPageMiss1 = Object.freeze({
  ...dataPage1,
  member: {
    ...dataPage1.member,
    current_page: 9
  }
})
const dataPageMiss2 = Object.freeze({
  ...dataPage2,
  member: {
    ...dataPage2.member,
    current_page: 9
  }
})

const createResult = Object.freeze({
  email: {
    count: 3,
    create_count: 1,
    exist_count: 2,
    notfound_count: 0
  },
  emails: [
    { email: 'user1@example.com', result: 'create', result_i18n: '招待しました。' },
    { email: 'user2@example.com', result: 'exist', result_i18n: '既に参加しています。' },
    { email: 'user3@example.com', result: 'notfound', result_i18n: 'アカウントが存在しません。登録後に招待してください。' }
  ]
})

export {
  detail,
  listCount3,
  defaultParams,
  findParams,
  findQuery,
  findData,
  dataCount0,
  dataCount1,
  dataPage1,
  dataPage2,
  dataPage3,
  dataPageTo2,
  dataPageTo3,
  dataPageMiss1,
  dataPageMiss2,
  createResult
}
