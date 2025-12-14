import { config } from '@vue/test-utils'

const $config = config.global.mocks.$config
const $tm = config.global.mocks.$tm

const detail = Object.freeze({
  code: 'code0001',
  upload_image: true,
  image_url: {
    small: 'https://example.com/images/space/small_noimage.jpg',
    medium: 'https://example.com/images/space/medium_noimage.jpg'
  },
  name: 'スペース1',
  description: 'スペース1の説明',
  private: true
})
const detailPower = computed(() => (power: string) => {
  return {
    ...detail,
    current_member: {
      power,
      power_i18n: ($tm('enums.member.power') as any)[String(power)]
    }
  }
})
const detailDestroy = computed(() => (power: string) => {
  return {
    ...detailPower.value(power),
    destroy_requested_at: '2000-01-01T12:34:56+09:00',
    destroy_schedule_at: '2000-01-08T12:34:56+09:00'
  }
})

const listCount2 = Object.freeze([
  {
    code: 'code0001',
    image_url: {
      small: 'https://example.com/images/space/small_noimage.jpg'
    },
    name: '非公開スペース1',
    description: '非公開スペース1の説明',
    private: true,
    destroy_schedule_at: '2000-02-08T12:34:56+09:00',
    current_member: {
      power: 'admin',
      power_i18n: '管理者'
    }
  },
  {
    code: 'code0002',
    name: '公開スペース2',
    description: '公開スペース2の説明',
    private: false
  }
])
const listMiniCount2 = Object.freeze([
  {
    code: 'code0001',
    image_url: {
      mini: 'https://example.com/images/space/mini_noimage.jpg'
    },
    name: 'スペース1'
  },
  {
    code: 'code0002',
    name: 'スペース2'
  }
])

let optionParams = {
  public: 1,
  private: 1,
  join: 1,
  nojoin: 1
}
const defaultParams = Object.freeze({
  text: '',
  ...optionParams,
  active: 1,
  destroy: 0
})

let optionQuery = {}
let optionData = {}
if ($config.public.enablePublicSpace) {
  optionParams = {
    public: 1,
    private: 0,
    join: 1,
    nojoin: 0
  }
  optionQuery = {
    public: String(optionParams.public),
    private: String(optionParams.private),
    join: String(optionParams.join),
    nojoin: String(optionParams.nojoin)
  }
  optionData = {
    public: optionParams.public === 1,
    private: optionParams.private === 1,
    join: optionParams.join === 1,
    nojoin: optionParams.nojoin === 1
  }
}
const findParams = Object.freeze({
  text: 'aaa',
  ...optionParams,
  active: 1,
  destroy: 0
})
const findQuery = Object.freeze({
  ...findParams,
  ...optionQuery,
  active: String(findParams.active),
  destroy: String(findParams.destroy),
  option: '1'
})
const findData = Object.freeze({
  ...findParams,
  ...optionData,
  active: findParams.active === 1,
  destroy: findParams.destroy !== 0,
  option: findQuery.option === '1'
})

const dataCount0 = Object.freeze({
  space: {
    total_count: 0,
    current_page: 1,
    total_pages: 0,
    limit_value: 2
  }
})
const dataCount1 = Object.freeze({
  space: {
    ...dataCount0.space,
    total_count: 1,
    total_pages: 1
  },
  spaces: [
    { code: 'code0001' }
  ]
})
const dataCount2 = Object.freeze({
  space: {
    ...dataCount0.space,
    total_count: 2,
    total_pages: 1
  },
  spaces: [
    { code: 'code0001' },
    { code: 'code0002' }
  ]
})

const dataPage1 = Object.freeze({
  space: {
    total_count: 5,
    current_page: 1,
    total_pages: 3,
    limit_value: 2
  },
  spaces: [
    { code: 'code0001' },
    { code: 'code0002' }
  ]
})
const dataPage2 = Object.freeze({
  space: {
    ...dataPage1.space,
    current_page: 2
  },
  spaces: [
    { code: 'code0003' },
    { code: 'code0004' }
  ]
})
const dataPage3 = Object.freeze({
  space: {
    ...dataPage1.space,
    current_page: 3
  },
  spaces: [
    { code: 'code0005' }
  ]
})

const dataPageTo2 = Object.freeze({
  ...dataPage2,
  spaces: dataPage1.spaces.concat(dataPage2.spaces)
})
const dataPageTo3 = Object.freeze({
  ...dataPage3,
  spaces: dataPageTo2.spaces.concat(dataPage3.spaces)
})

const dataPageMiss1 = Object.freeze({
  ...dataPage1,
  space: {
    ...dataPage1.space,
    current_page: 9
  }
})
const dataPageMiss2 = Object.freeze({
  ...dataPage2,
  space: {
    ...dataPage2.space,
    current_page: 9
  }
})

export {
  detail,
  detailPower,
  detailDestroy,
  listCount2,
  listMiniCount2,
  defaultParams,
  findParams,
  findQuery,
  findData,
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
