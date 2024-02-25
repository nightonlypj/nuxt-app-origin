<template>
  <Head>
    <Title>{{ $t('スペース') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <v-card>
      <v-card-title>{{ $t('スペース') }}</v-card-title>
      <v-card-text>
        <SpacesSearch
          ref="spacesSearch"
          v-model:query="query"
          :processing="processing || reloading"
          @search="searchSpacesList"
        />
      </v-card-text>
    </v-card>

    <v-card class="mt-2">
      <AppProcessing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col class="d-flex py-2">
            <div v-if="space != null && space.total_count > 0" class="align-self-center ml-2">
              {{ $t(`{total}件（${space.total_count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, space.total_count, 'N/A') }) }}
            </div>
          </v-col>
          <v-col class="d-flex justify-end">
            <div v-if="$auth.loggedIn" class="mr-1">
              <SpacesCreate />
            </div>
            <!-- AppListSetting
              v-model:hidden-items="hiddenItems"
              model="space"
            / -->
          </v-col>
        </v-row>

        <template v-if="spaces == null || spaces.length === 0">
          <v-divider class="my-4" />
          <span class="ml-1">{{ $t('対象の{name}が見つかりません。', { name: $t('スペース') }) }}</span>
          <v-divider class="my-4" />
        </template>
        <template v-else>
          <v-divider class="mt-2" />
          <SpacesLists
            :spaces="spaces"
            :hidden-items="hiddenItems"
          />
          <v-divider class="mb-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && space != null && space.current_page < space.total_pages"
          :identifier="page"
          @infinite="getNextSpacesList"
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
// import AppListSetting from '~/components/app/ListSetting.vue' // NOTE: 項目が少ないので未使用
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesCreate from '~/components/spaces/Create.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import { localeString } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import { redirectError } from '~/utils/redirect'
import { sleep, checkSearchParams } from '~/utils/search'
import { checkHeadersUid } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

function getQuery (targetQuery: any = {}) {
  let publicQuery = {}
  if ($config.public.enablePublicSpace) {
    publicQuery = {
      public: targetQuery?.public !== '0',
      private: targetQuery?.private !== '0',
      join: targetQuery?.join !== '0',
      nojoin: targetQuery?.nojoin !== '0'
    }
  }
  return {
    text: targetQuery?.text || null,
    ...publicQuery,
    active: targetQuery?.active !== '0',
    destroy: targetQuery?.destroy === '1',
    option: targetQuery?.option === '1'
  }
}

const loading = ref(true)
const processing = ref(false)
const reloading = ref(false)
const query = ref<any>(getQuery($route.query))
const params = ref<any>(null)
const uid = ref<string | null>(null)
const error = ref(false)
const testState = ref<string | null>(null) // Vitest用
const page = ref(1)
const space = ref<any>(null)
const spaces = ref<any>(null)
const hiddenItems = ref([]) // ref(localStorage.getItem('space.hidden-items')?.split(',') || [])

const spacesSearch = ref<any>(null)

created()
async function created () {
  if (!await getSpacesList()) { return }

  loading.value = false
}

// 左メニュークリックで、条件を初期化して検索
watch(() => $route.query, () => {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('watch: $route.query', $route.query) }
  if (Object.keys($route.query).length > 0) { return }

  query.value = getQuery()
  searchSpacesList(false)
})

// スペース一覧検索
async function searchSpacesList (updateURL = true) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('searchSpacesList', updateURL) }

  params.value = null
  spacesSearch.value.updateWaiting(await reloadSpacesList(updateURL))
}

// スペース一覧再取得
async function reloadSpacesList (updateURL = true) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('reloadSpacesList', updateURL, reloading.value) }

  // 再取得中は待機  NOTE: 異なる条件のデータが混じらないようにする為
  let count = 0
  while (count < $config.public.reloading.maxCount) {
    if (!reloading.value) { break }

    /* c8 ignore next */
    if (!$config.public.env.test) { await sleep($config.public.reloading.sleepMs) }
    count++
  }
  if (count >= $config.public.reloading.maxCount) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Stop') }

    $toast.error($t('system.timeout'))
    return false
  }
  reloading.value = true

  page.value = 1
  const result = await getSpacesList()

  if (updateURL) {
    let publicQuery = {}
    if ($config.public.enablePublicSpace) {
      publicQuery = {
        public: String(params.value.public),
        private: String(params.value.private),
        join: String(params.value.join),
        nojoin: String(params.value.nojoin)
      }
    }
    navigateTo({
      query: {
        ...params.value,
        ...publicQuery,
        active: String(params.value.active),
        destroy: String(params.value.destroy),
        option: String(Number(query.value.option))
      }
    })
  }

  reloading.value = false
  return result
}

// 次頁のスペース一覧取得
async function getNextSpacesList ($state: any) {
  /* c8 ignore start */
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('getNextSpacesList', page.value + 1, processing.value, error.value) }

  if (error.value) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
  if (processing.value) { return }
  /* c8 ignore stop */

  page.value = space.value.current_page + 1
  if (!await getSpacesList()) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'error'; return }

    $state.error()
    /* c8 ignore stop */
  } else if (space.value.current_page < space.value.total_pages) {
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

// スペース一覧取得
async function getSpacesList () {
  processing.value = true

  if (params.value == null) {
    let publicParams = {}
    if ($config.public.enablePublicSpace) {
      publicParams = {
        public: Number(query.value.public),
        private: Number(query.value.private),
        join: Number(query.value.join),
        nojoin: Number(query.value.nojoin)
      }
    }
    params.value = {
      ...query.value,
      text: query.value.text || '',
      ...publicParams,
      active: Number(query.value.active),
      destroy: Number(query.value.destroy)
    }
    delete params.value.option
  }

  let privateParams = {}
  if (!$config.public.enablePublicSpace) {
    privateParams = {
      public: 1,
      private: 1,
      join: 1,
      nojoin: 1
    }
  }
  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.spaces.listUrl), 'GET', {
    ...params.value,
    ...privateParams,
    page: page.value
  })
  if (!checkHeadersUid(response, page, uid)) { return false }

  let alert: string | null = null
  if (response?.ok) {
    if (data?.space?.current_page === page.value) {
      space.value = data.space
      if (reloading.value || spaces.value == null) {
        spaces.value = data.spaces?.slice()
      } else {
        spaces.value.push(...data.spaces)
      }
      checkSearchParams(params.value, data.search_params, $t)
    } else {
      alert = $t('system.error')
    }
  } else {
    if (data == null) {
      alert = $t(`network.${response?.status == null ? 'failure' : 'error'}`)
    } else {
      alert = data.alert || $t('system.default')
    }
  }
  if (alert != null) {
    if (space.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert, notice: data?.notice })
      return false
    } else {
      $toast.error(alert)
      if (data?.notice != null) { $toast.info(data.notice) }
    }
  }

  page.value = space.value.current_page
  error.value = alert != null

  processing.value = false
  return alert == null
}
</script>
