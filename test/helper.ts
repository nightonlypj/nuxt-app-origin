import { RouterLinkStub } from '@vue/test-utils'
import { envConfig } from '../config/test'
import { commonConfig } from '../config/common'
import { ja } from '~/locales/ja'

// NuxtLinkのURL一覧を配列で返却
const getLinks = (wrapper: any) => {
  return wrapper.findAllComponents(RouterLinkStub).map((link: any) => link.props().to)
}

// テスト内容
const loadingTest = (wrapper: any, AppLoading: any) => {
  expect(wrapper.findComponent(AppLoading).exists()).toBe(true)
}

const blankTest = (wrapper: any, AppLoading: any = null) => {
  if (AppLoading != null) {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
  }
  expect(wrapper.html({ raw: true }).replaceAll('<!--v-if-->', '')).toBe('')
}

const presentTest = (wrapper: any, AppLoading: any = null) => {
  if (AppLoading != null) {
    expect(wrapper.findComponent(AppLoading).exists()).toBe(false)
  }
  expect(wrapper.html({ raw: true }).replaceAll('<!--v-if-->', '')).not.toBe('')
}

const mockCalledTest = (mock: any, count: number, ...args: any[]) => {
  expect(mock).toBeCalledTimes(count)
  if (count > 0) {
    expect(mock).nthCalledWith(count, ...args)
  }
}

const messageTest = (wrapper: any, AppMessage: any, data: any) => {
  expect(wrapper.findComponent(AppMessage).exists()).toBe(true)
  expect(wrapper.findComponent(AppMessage).vm.$props.alert).toBe(data?.alert || null)
  expect(wrapper.findComponent(AppMessage).vm.$props.notice).toBe(data?.notice || null)
}

const emitMessageTest = (wrapper: any, data: any) => {
  expect(wrapper.emitted().alert).toEqual([[data.alert]])
  expect(wrapper.emitted().notice).toEqual([[data.notice]])
}

const mockToast = {
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  success: vi.fn()
}

const toastMessageTest = (toastMock: any, message: any) => {
  mockCalledTest(toastMock.error, message.error == null ? 0 : 1, message.error)
  mockCalledTest(toastMock.info, message.info == null ? 0 : 1, message.info)
  mockCalledTest(toastMock.warning, message.warning == null ? 0 : 1, message.warning)
  mockCalledTest(toastMock.success, message.success == null ? 0 : 1, message.success)
}

const disabledTest = (wrapper: any, AppProcessing: any, button: any, disabled: boolean) => {
  expect(wrapper.findComponent(AppProcessing).exists()).toBe(false)
  expect(button.element.disabled).toBe(disabled)
}

export default {
  envConfig,
  commonConfig,
  locales: ja,
  getLinks,
  loadingTest,
  blankTest,
  presentTest,
  mockCalledTest,
  messageTest,
  emitMessageTest,
  mockToast,
  toastMessageTest,
  disabledTest
}
