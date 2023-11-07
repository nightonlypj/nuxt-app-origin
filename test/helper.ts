import { RouterLinkStub } from '@vue/test-utils'
import { envConfig } from '../config/test'
import { commonConfig } from '../config/common'
import { ja } from '~/locales/ja'

// NuxtLinkのURL一覧を配列で返却
const getLinks = (wrapper: any) => {
  return wrapper.findAllComponents(RouterLinkStub).map((item: any) => item.props().to)
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
  expect(wrapper.findComponent(AppMessage).vm.$props.messages).toEqual({ alert: data?.alert || '', notice: data?.notice || '' })
}

const emitMessageTest = (wrapper: any, data: any) => {
  expect(wrapper.emitted().messages).toEqual([[{ alert: data.alert, notice: data.notice }]])
}

const mockToast = {
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  success: vi.fn()
}

const toastMessageTest = (toastMock: any, messages: any) => {
  mockCalledTest(toastMock.error, messages.error == null ? 0 : 1, messages.error)
  mockCalledTest(toastMock.info, messages.info == null ? 0 : 1, messages.info)
  mockCalledTest(toastMock.warning, messages.warning == null ? 0 : 1, messages.warning)
  mockCalledTest(toastMock.success, messages.success == null ? 0 : 1, messages.success)
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
