<template>
  <AppLoading v-if="loading" height="20vh" />
  <v-card v-else-if="alert !== '' || (infomations != null && infomations.length > 0)">
    <v-card-title>大切なお知らせ</v-card-title>
    <v-card-text v-if="alert !== ''">
      <v-icon color="warning">mdi-alert</v-icon>
      {{ alert }}
    </v-card-text>
    <v-card-text v-else>
      <article v-for="infomation in infomations" :key="infomation.id" class="mb-1">
        <InfomationsLabel :infomation="infomation" />
        <span class="ml-1">
          <template v-if="infomation.body_present || infomation.summary !== null">
            <NuxtLink :to="`/infomations/${infomation.id}`">{{ infomation.title }}</NuxtLink>
          </template>
          <template v-else>
            {{ infomation.title }}
          </template>
        </span>
        <span class="ml-1">
          ({{ dateFormat('ja', infomation.started_at, 'N/A') }})
        </span>
      </article>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import { dateFormat } from '~/utils/display'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()

const loading = ref(true)
const alert = ref('')
const infomations = ref<any>(null)

created()
async function created () {
  await getInfomationsImportant()
  loading.value = false
}

// 大切なお知らせ一覧取得
async function getInfomationsImportant () {
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.infomations.importantUrl)

  if (response?.ok) {
    if (data?.infomations != null) {
      infomations.value = data.infomations
    } else {
      alert.value = $t('system.error_short')
    }
  } else {
    if (data == null) {
      alert.value = $t(`network.${response?.status == null ? 'failure' : 'error'}_short`)
    } else {
      alert.value = $t('system.default_short')
    }
  }
}
</script>
