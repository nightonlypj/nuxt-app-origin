<template>
  <Head>
    <Title>{{ title }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else>
    <template v-if="infomation != null">
      <v-card-title>
        <div>
          <InfomationsLabel :infomation="infomation" />
          <span class="ml-1 font-weight-bold">
            {{ infomation.title }}
          </span>
          ({{ dateFormat(locale, infomation.started_at, 'N/A') }})
        </div>
      </v-card-title>
      <v-card-text>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="infomation.body" class="mx-2 my-2" v-html="infomation.body" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else-if="infomation.summary" class="mx-2 my-2" v-html="infomation.summary" />
      </v-card-text>
      <v-divider />
    </template>
    <v-card-actions>
      <ul class="my-2">
        <li><NuxtLink :to="localePath('/infomations')">{{ $t('一覧') }}</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import { dateFormat } from '~/utils/display'
import { redirectError } from '~/utils/redirect'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const $route = useRoute()

const loading = ref(true)
const infomation = ref<any>(null)

const title = computed(() => {
  let label = ''
  if (infomation.value?.label_i18n != null && infomation.value.label_i18n !== '') {
    label = `[${infomation.value.label_i18n}]`
  }
  return label + (infomation.value?.title || '')
})

created()
async function created () {
  const id = Number($route.params.id)
  if (isNaN(id) || String(id) !== String($route.params.id)) { return redirectError(404, {}) }
  if (!await getInfomationsDetail(id)) { return }

  loading.value = false
}

// お知らせ詳細取得
async function getInfomationsDetail (id: number) {
  const url = $config.public.infomations.detailUrl.replace(':id', String(id))
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url)

  if (response?.ok) {
    if (data?.infomation != null) {
      infomation.value = data.infomation
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 404) {
      redirectError(404, { alert: data?.alert, notice: data?.notice })
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}
</script>
