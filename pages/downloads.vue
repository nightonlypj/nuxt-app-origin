<template>
  <Head>
    <Title>ダウンロード結果</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card>
      <v-card-title>ダウンロード結果</v-card-title>
    </v-card>
    <v-card>
      <v-card-text class="pt-0">
        <AppProcessing v-if="reloading" />
        <v-row>
          <v-col class="d-flex align-self-center text-no-wrap">
            {{ localeString('ja', download.total_count, 'N/A') }}件
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn
              id="downloads_reload_btn"
              color="secondary"
              :disabled="processing || reloading"
              @click="reloadDownloadsList()"
            >
              <v-icon>mdi-sync</v-icon>
              <v-tooltip activator="parent" location="bottom">更新</v-tooltip>
            </v-btn>
          </v-col>
        </v-row>

        <template v-if="downloads == null || downloads.length === 0">
          <v-divider class="my-4" />
          <span class="ml-1">ダウンロード結果が見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <template v-if="downloads != null && downloads.length > 0">
          <v-divider class="my-2" />
          <DownloadsLists
            :downloads="downloads"
            @downloads-file="getDownloadsFile"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && download != null && download.current_page < download.total_pages"
          :identifier="page"
          @infinite="getNextDownloadsList"
        >
          <template #spinner>
            <AppLoading height="10vh" class="mt-4" />
          </template>
          <template #complete />
          <template #error="{ retry }">
            <AppErrorRetry class="mt-4" @retry="error = false; retry()" />
          </template>
        </InfiniteLoading>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import InfiniteLoading from 'v3-infinite-loading'
import AppErrorRetry from '~/components/app/ErrorRetry.vue'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import DownloadsLists from '~/components/downloads/Lists.vue'
import { localeString } from '~/utils/display'
import { redirectAuth, redirectError } from '~/utils/redirect'
import { checkHeadersUid } from '~/utils/auth'
import { checkSearchParams } from '~/utils/search'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const reloading = ref(false)
const messages = ref({
  alert: '',
  notice: ''
})
const params = ref<any>(null)
const uid = ref<string | null>(null)
const error = ref(false)
const testState = ref<string | null>(null) // Vitest用
const page = ref(1)
const download = ref<any>(null)
const downloads = ref<any>(null)
const testDelay = ref<any>(null) // Vitest用
const testElement = ref<any>(null) // Vitest用

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if (!await getDownloadsList()) { return }

  loading.value = false
}

// ダウンロード結果一覧再取得
async function reloadDownloadsList () {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('reloadDownloadsList', reloading.value) }

  reloading.value = true
  page.value = 1

  await getDownloadsList()
  reloading.value = false
}

// 次頁のダウンロード結果一覧取得
async function getNextDownloadsList ($state: any) {
  /* c8 ignore start */
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('getNextDownloadsList', page.value + 1, processing.value, error.value) }
  if (error.value) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
  if (processing.value) { return }
  /* c8 ignore stop */

  page.value = download.value.current_page + 1
  if (!await getDownloadsList()) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'error'; return }

    $state.error()
    /* c8 ignore stop */
  } else if (download.value.current_page < download.value.total_pages) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'loaded'; return }

    $state.loaded()
    /* c8 ignore stop */
  } else {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'complete'; return }

    $state.complete()
  }
  /* c8 ignore stop */
}

// ダウンロード結果一覧取得
async function getDownloadsList () {
  processing.value = true

  params.value = {}
  if ($route.query?.target_id != null) { params.value.target_id = Number($route.query.target_id) }

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.downloads.listUrl, 'GET', {
    ...params.value,
    page: page.value
  })
  if (!checkHeadersUid(response, page, uid)) { return false }

  let alert: string | null = null
  if (response?.ok) {
    if (data?.download?.current_page === page.value) {
      successDownloadsList(data)
    } else {
      alert = $t('system.error')
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ notice: $t('auth.unauthenticated') })
      return false
    } else if (data == null) {
      alert = $t(`network.${response?.status == null ? 'failure' : 'error'}`)
    } else {
      alert = $t('system.default')
    }
  }
  if (alert != null) {
    if (download.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert })
      return false
    } else {
      $toast.error(alert)
      if (data?.notice != null) { $toast.info(data.notice) }
    }
  }

  page.value = download.value.current_page
  error.value = alert != null

  processing.value = false
  return alert == null
}
function successDownloadsList (data: any) {
  download.value = data.download
  if (reloading.value || downloads.value == null) {
    downloads.value = data.downloads?.slice()
  } else {
    downloads.value.push(...data.downloads)
  }

  if (params.value.target_id != null && page.value === 1 && data.target != null && data.target.last_downloaded_at == null) {
    messages.value = {
      alert: data.target.alert || '',
      notice: data.target.notice || ''
    }
    if (!reloading.value) {
      if (['waiting', 'processing'].includes(data.target.status)) {
        /* c8 ignore next */ // eslint-disable-next-line no-console
        if ($config.public.debug) { console.log('setTimeout: checkDownloadComplete', params.value.target_id, 1) }

        testDelay.value = [1000 * 3, params.value.target_id, 1] // 3秒後
        setTimeout(checkDownloadComplete, ...testDelay.value)
      } else {
        if (data.target.alert != null) { $toast.error(data.target.alert) }
        if (data.target.notice != null) { $toast.success(data.target.notice) }
      }
    }
  }

  if (data.undownloaded_count != null && data.undownloaded_count !== $auth.user.undownloaded_count) {
    $auth.updateUserUndownloadedCount(data.undownloaded_count)
  }
  checkSearchParams(params.value, data.search_params)
}

// 完了チェック
async function checkDownloadComplete (targetId: number, count: number) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('checkDownloadComplete', targetId, count) }

  const index = downloads.value.findIndex((element: any) => element.id === targetId)
  if (index < 0 || !['waiting', 'processing'].includes(downloads.value[index].status)) { // NOTE: 更新ボタンで完了になっていた場合はスキップ
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }

    return
  }

  params.value = {
    id: targetId,
    target_id: targetId
  }
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.downloads.listUrl, 'GET', params.value)

  if (response?.ok) {
    if (data?.downloads?.length === 1 && data.downloads[0].id === targetId && data.target != null) {
      successDownloadComplete(targetId, count, index, data)
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }
}
function successDownloadComplete (targetId: number, count: number, index: number, data: any) {
  if (['waiting', 'processing'].includes(data.target.status)) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('setTimeout: checkDownloadComplete', targetId, count + 1) }

    testDelay.value = [1000 * (count + 1) * 3, targetId, count + 1] // 回数×3秒後（6、9、12・・・）
    setTimeout(checkDownloadComplete, ...testDelay.value)
    return
  }

  downloads.value.splice(index, 1, data.downloads[0])
  messages.value = {
    alert: data.target.alert || '',
    notice: data.target.notice || ''
  }
  if (data.target.alert != null) { $toast.error(data.target.alert) }
  if (data.target.notice != null) { $toast.success(data.target.notice) }
  $auth.updateUserUndownloadedCount(data.undownloaded_count)
  checkSearchParams(params.value, data.search_params)
}

// ダウンロード
async function getDownloadsFile (item: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('getDownloadsFile', item) }

  const url = $config.public.downloads.fileUrl.replace(':id', item.id)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'GET', null, null, 'text/csv')

  if (response?.ok) {
    if (data != null) {
      successDownloadsFile(response, data, item)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 404) {
      $toast.error(data?.alert || $t('system.notfound'))
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }
}
function successDownloadsFile (response: any, data: any, item: any) {
  const element = document.createElement('a')
  element.href = (window.URL || window.webkitURL).createObjectURL(data)

  const contentDisposition = response.headers.get('content-disposition').match(/filename="([^"]*)"/) || []
  if (contentDisposition.length >= 2) { element.download = contentDisposition[1] }

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
  testElement.value = element

  if (item.last_downloaded_at != null) { return }

  const index = downloads.value.findIndex((element: any) => element.id === item.id)
  if (index >= 0) {
    item.last_downloaded_at = true
    downloads.value.splice(index, 1, item)
  }

  if (item.id === Number($route.query?.target_id)) { messages.value.notice = '' }

  if ($auth.user?.undownloaded_count > 0) {
    $auth.updateUserUndownloadedCount($auth.user.undownloaded_count - 1)
  }
}
</script>
