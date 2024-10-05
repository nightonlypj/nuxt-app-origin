const listCount5 = Object.freeze([
  {
    id: 5,
    status: 'waiting',
    status_i18n: '処理待ち',
    requested_at: '2000-01-05T12:34:56+09:00',
    model: 'member',
    model_i18n: 'メンバー1',
    space: {
      name: 'スペース1'
    },
    target_i18n: '全て',
    format_i18n: 'CSV',
    char_code_i18n: 'Shift_JIS',
    newline_code_i18n: 'CR+LF'
  },
  {
    id: 4,
    status: 'processing',
    status_i18n: '処理中',
    requested_at: '2000-01-04T12:34:56+09:00',
    model: 'member',
    model_i18n: 'メンバー2',
    space: {}
  },
  {
    id: 3,
    status: 'success',
    status_i18n: '成功',
    requested_at: '2000-01-03T12:34:56+09:00',
    completed_at: '2000-02-03T12:34:56+09:00',
    model: 'member',
    model_i18n: 'メンバー3'
  },
  {
    id: 2,
    status: 'failure',
    status_i18n: '失敗',
    requested_at: '2000-01-02T12:34:56+09:00',
    completed_at: '2000-02-02T12:34:56+09:00'
  },
  {
    id: 1,
    status: 'success',
    status_i18n: '成功',
    requested_at: '2000-01-01T12:34:56+09:00',
    completed_at: '2000-02-01T12:34:56+09:00',
    last_downloaded_at: '2000-03-01T12:34:56+09:00',
    model_i18n: 'モデル1'
  }
])

const dataCount0 = Object.freeze({
  download: {
    total_count: 0,
    current_page: 1,
    total_pages: 0,
    limit_value: 2
  },
  undownloaded_count: 0
})
const dataCount1 = Object.freeze({
  download: {
    total_count: 1,
    current_page: 1,
    total_pages: 1,
    limit_value: 2
  },
  downloads: [
    { id: 1 }
  ],
  undownloaded_count: 1
})
const dataCount2 = Object.freeze({
  download: {
    total_count: 2,
    current_page: 1,
    total_pages: 1,
    limit_value: 2
  },
  downloads: [
    { id: 1 },
    { id: 2 }
  ],
  undownloaded_count: 1
})

const dataPage1 = Object.freeze({
  download: {
    total_count: 5,
    current_page: 1,
    total_pages: 3,
    limit_value: 2
  },
  downloads: [
    { id: 5, status: 'waiting' },
    { id: 4, status: 'success' }
  ]
})
const dataPage2 = Object.freeze({
  download: {
    total_count: 5,
    current_page: 2,
    total_pages: 3,
    limit_value: 2
  },
  downloads: [
    { id: 3, status: 'success' },
    { id: 2, status: 'processing' }
  ]
})
const dataPage3 = Object.freeze({
  download: {
    total_count: 5,
    current_page: 3,
    total_pages: 3,
    limit_value: 2
  },
  downloads: [
    { id: 1, status: 'failure' }
  ]
})

const dataPageTo2 = Object.freeze({
  ...dataPage2,
  downloads: dataPage1.downloads.concat(dataPage2.downloads)
})
const dataPageTo3 = Object.freeze({
  ...dataPage3,
  downloads: dataPageTo2.downloads.concat(dataPage3.downloads)
})

const dataPageMiss1 = Object.freeze({
  ...dataPage1,
  download: {
    ...dataPage1.download,
    current_page: 9
  }
})
const dataPageMiss2 = Object.freeze({
  ...dataPage2,
  download: {
    ...dataPage2.download,
    current_page: 9
  }
})

export {
  listCount5,
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
