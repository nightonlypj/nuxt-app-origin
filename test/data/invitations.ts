import { detail as space } from '~/test/data/spaces'

const detail = Object.freeze({
  code: 'invitation000000000000001',
  power: 'admin',
  power_i18n: '管理者',
  created_user: {
    code: 'code000000000000000000001'
  },
  created_at: '2000-01-01T12:34:56+09:00',
  destroy_schedule_days: 789
})
const detailActive = Object.freeze({
  ...detail,
  status: 'active',
  domains: ['a.example.com', 'b.example.com'],
  memo: 'メモ'
})
const detailExpired = Object.freeze({
  ...detail,
  status: 'expired',
  domains: ['example.com'],
  ended_at: '2000-01-31T12:34:56+09:00',
  last_updated_user: {
    code: 'code000000000000000000002'
  },
  last_updated_at: '2000-01-02T12:34:56+09:00'
})
const detailDeleted = Object.freeze({
  ...detail,
  status: 'deleted',
  domains: ['example.com'],
  memo: 'メモ',
  destroy_requested_at: '2000-01-02T12:34:56+09:00',
  destroy_schedule_at: '2000-01-09T12:34:56+09:00',
  created_user: {
    deleted: true
  },
  last_updated_user: {
    deleted: true
  },
  last_updated_at: '2000-01-02T12:34:56+09:00'
})
const detailEmailJoined = Object.freeze({
  ...detail,
  status: 'email_joined',
  email: 'user1@example.com',
  email_joined_at: '2000-01-02T12:34:56+09:00'
})

const listCount4 = Object.freeze([
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

const dataCount0 = Object.freeze({
  space,
  invitation: {
    total_count: 0,
    current_page: 1,
    total_pages: 0,
    limit_value: 2
  }
})
const dataCount1 = Object.freeze({
  space,
  invitation: {
    total_count: 1,
    current_page: 1,
    total_pages: 1,
    limit_value: 2
  },
  invitations: [
    { code: 'invitation000000000000001' }
  ]
})
const dataCount2 = Object.freeze({
  space,
  invitation: {
    total_count: 2,
    current_page: 1,
    total_pages: 1,
    limit_value: 2
  },
  invitations: [
    { code: 'invitation000000000000001' },
    { code: 'invitation000000000000002' }
  ]
})

const dataPage1 = Object.freeze({
  space,
  invitation: {
    total_count: 5,
    current_page: 1,
    total_pages: 3,
    limit_value: 2
  },
  invitations: [
    { code: 'invitation000000000000001' },
    { code: 'invitation000000000000002' }
  ]
})
const dataPage2 = Object.freeze({
  space,
  invitation: {
    total_count: 5,
    current_page: 2,
    total_pages: 3,
    limit_value: 2
  },
  invitations: [
    { code: 'invitation000000000000003' },
    { code: 'invitation000000000000004' }
  ]
})
const dataPage3 = Object.freeze({
  space,
  invitation: {
    total_count: 5,
    current_page: 3,
    total_pages: 3,
    limit_value: 2
  },
  invitations: [
    { code: 'invitation000000000000005' }
  ]
})

const dataPageTo2 = Object.freeze({
  ...dataPage2,
  invitations: dataPage1.invitations.concat(dataPage2.invitations)
})
const dataPageTo3 = Object.freeze({
  ...dataPage3,
  invitations: dataPageTo2.invitations.concat(dataPage3.invitations)
})

const dataPageMiss1 = Object.freeze({
  ...dataPage1,
  invitation: {
    ...dataPage1.invitation,
    current_page: 9
  }
})
const dataPageMiss2 = Object.freeze({
  ...dataPage2,
  invitation: {
    ...dataPage2.invitation,
    current_page: 9
  }
})

export {
  detail,
  detailActive,
  detailExpired,
  detailDeleted,
  detailEmailJoined,
  listCount4,
  dataCount0,
  dataCount1,
  dataCount2,
  dataPage1,
  dataPage2,
  dataPage3,
  dataPageTo2,
  dataPageTo3,
  dataPageMiss1,
  dataPageMiss2
}
