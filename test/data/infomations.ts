const detail = Object.freeze({
  label_i18n: 'メンテナンス',
  title: 'タイトル1',
  summary: '概要1',
  body: '本文1',
  started_at: '2000-01-01T12:34:56+09:00'
})

const listCount2 = Object.freeze([ // 本文あり・なし
  {
    id: 1,
    title: 'タイトル1',
    summary: null,
    body_present: true,
    started_at: '2000-01-01T12:34:56+09:00'
  },
  {
    id: 2,
    title: 'タイトル2',
    summary: '概要2',
    body_present: false,
    started_at: '2000-01-02T12:34:56+09:00'
  }
])
const listCount4 = Object.freeze( // 本文あり・なし × 概要あり・なし
  listCount2.concat([
    {
      id: 3,
      title: 'タイトル3',
      summary: '概要3',
      body_present: true,
      started_at: '2000-01-03T12:34:56+09:00'
    },
    {
      id: 4,
      title: 'タイトル4',
      summary: null,
      body_present: false,
      started_at: '2000-01-04T12:34:56+09:00'
    }
  ])
)

const dataCount0 = Object.freeze({
  infomation: {
    total_count: 0,
    current_page: 1,
    total_pages: 0,
    limit_value: 2
  }
})
const dataCount1 = Object.freeze({
  infomation: {
    ...dataCount0.infomation,
    total_count: 1,
    total_pages: 1
  },
  infomations: [
    { id: 1 }
  ]
})
const dataCount2 = Object.freeze({
  infomation: {
    ...dataCount0.infomation,
    total_count: 2,
    total_pages: 1
  },
  infomations: [
    { id: 1 },
    { id: 2 }
  ]
})

const dataPage1 = Object.freeze({
  infomation: {
    total_count: 3,
    current_page: 1,
    total_pages: 2,
    limit_value: 2
  },
  infomations: [
    { id: 1 },
    { id: 2 }
  ]
})
const dataPage2 = Object.freeze({
  infomation: {
    ...dataPage1.infomation,
    current_page: 2
  },
  infomations: [
    { id: 3 }
  ]
})

const dataPageMiss1 = Object.freeze({
  ...dataPage1,
  infomation: {
    ...dataPage1.infomation,
    current_page: 9
  }
})
const dataPageMiss2 = Object.freeze({
  ...dataPage2,
  infomation: {
    ...dataPage2.infomation,
    current_page: 9
  }
})

export {
  detail,
  listCount2,
  listCount4,
  dataCount0,
  dataCount1,
  dataCount2,
  dataPage1,
  dataPage2,
  dataPageMiss1,
  dataPageMiss2
}
