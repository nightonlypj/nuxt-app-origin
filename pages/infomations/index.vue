<template>
  <Head>
    <Title>{{ $t('お知らせ') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else>
    <AppProcessing v-if="processing" />
    <v-card-title>{{ $t('お知らせ') }}</v-card-title>
    <v-card-text>
      <v-row v-if="infomation != null">
        <v-col class="align-self-center text-no-wrap ml-2">
          <template v-if="enablePagination">
            {{ $t('{total}件中 {start}-{end}件を表示', { total: localeString(locale, infomation.total_count, 'N/A'), start: localeString(locale, pageFirstNumber(infomation), 'N/A'), end: localeString(locale, pageLastNumber(infomation), 'N/A') }) }}
          </template>
          <template v-else-if="infomation.total_count === 1">
            {{ $t('1件') }}
          </template>
          <template v-else>
            {{ $t('{total}件', { total: localeString(locale, infomation.total_count, 'N/A') }) }}
          </template>
        </v-col>
        <v-col v-if="enablePagination" class="pa-0">
          <div class="d-flex justify-end">
            <v-pagination id="infomation_pagination1" v-model="page" :length="infomation.total_pages" @click="getInfomationsList()" />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />
      <template v-if="infomations == null || infomations.length === 0">
        <span class="ml-1">{{ $t('{name}はありません。', { name: $t('お知らせ') }) }}</span>
        <v-divider class="my-4" />
      </template>
      <InfomationsLists v-else :infomations="infomations" />

      <template v-if="enablePagination">
        <v-pagination id="infomation_pagination2" v-model="page" :length="infomation.total_pages" @click="getInfomationsList()" />
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import { localeString, pageFirstNumber, pageLastNumber } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import { redirectError } from '~/utils/redirect'

const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const page = ref(Number($route.query?.page) || 1)
const infomation = ref<any>(null)
const infomations = ref<any>(null)

const enablePagination = computed(() => infomation.value?.total_pages > 1)

created()
async function created () {
  if (!await getInfomationsList()) { return }

  if ($auth.loggedIn) { $auth.resetUserInfomationUnreadCount() }
  loading.value = false
}

// お知らせ一覧取得
async function getInfomationsList () {
  processing.value = true

  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.infomations.listUrl), 'GET', {
    page: page.value
  })

  let alert: string | null = null
  if (response?.ok) {
    if (data?.infomation?.current_page === page.value) {
      infomation.value = data.infomation
      infomations.value = data.infomations
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
    if (infomation.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert, notice: data?.notice })
      return false
    } else {
      $toast.error(alert)
      if (data?.notice != null) { $toast.info(data.notice) }
    }
  }

  page.value = infomation.value.current_page
  navigateTo(page.value === 1 ? {} : { query: { page: page.value } }) // NOTE: URLパラメータを変更する為

  processing.value = false
  return alert == null
}
</script>
