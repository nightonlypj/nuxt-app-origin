<template>
  <Head>
    <Title>お知らせ</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else>
    <AppProcessing v-if="processing" />
    <v-card-title>お知らせ</v-card-title>
    <v-card-text>
      <v-row v-if="infomation != null">
        <v-col class="align-self-center text-no-wrap">
          {{ localeString('ja', infomation.total_count, 'N/A') }}件<template v-if="enablePagination">中 {{ localeString('ja', pageFirstNumber(infomation), 'N/A') }}-{{ localeString('ja', pageLastNumber(infomation), 'N/A') }}件を表示</template>
        </v-col>
        <v-col v-if="enablePagination" class="pa-0">
          <div class="d-flex justify-end">
            <v-pagination id="infomation_pagination1" v-model="page" :length="infomation.total_pages" @click="getInfomationsList()" />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />
      <template v-if="infomations == null || infomations.length === 0">
        <span class="ml-1">お知らせはありません。</span>
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
import { localeString, pageFirstNumber, pageLastNumber } from '~/utils/helper'
import { redirectError } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const page = ref(Number($route?.query?.page) || 1)
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

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.infomations.listUrl, 'GET', { page: page.value })

  let alert = ''
  if (response?.ok) {
    if (data?.infomation?.current_page !== page.value) {
      alert = $t('system.error')
    }
  } else {
    if (data == null) {
      alert = $t(`network.${response?.status == null ? 'failure' : 'error'}`)
    } else {
      alert = $t('system.default')
    }
  }
  if (alert === '') {
    infomation.value = data.infomation
    infomations.value = data.infomations
  } else {
    if (infomation.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert })
    } else {
      $toast.error(alert)
    }
  }

  page.value = infomation.value?.current_page || 1
  navigateTo(page.value === 1 ? {} : { query: { page: page.value } }) // NOTE: URLパラメータを変更する為

  processing.value = false
  return alert === ''
}
</script>
