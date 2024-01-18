<template>
  <template v-if="loading || alert !== '' || (spaces != null && spaces.length > 0)">
    <AppLoading v-if="loading" height="20vh" />
    <v-card v-else link>
      <v-card-title>
        <v-row>
          <v-col>
            {{ $config.public.enablePublicSpace ? '新しい' : '' }}公開スペース
          </v-col>
          <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex pl-0">
            <NuxtLink to="/spaces">
              <v-btn color="primary" class="mr-2">
                <v-icon>mdi-magnify</v-icon>
                <span class="ml-1">探す</span>
              </v-btn>
            </NuxtLink>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="alert !== ''">
        <v-icon color="warning">mdi-alert</v-icon>
        {{ alert }}
      </v-card-text>
      <v-card-text v-else>
        <v-list class="overflow-auto py-0" style="max-height: 200px">
          <!-- /* c8 ignore next 2 */ -->
          <component
            :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
            v-for="space in spaces"
            :id="`public_space_link_${space.code}`"
            :key="space.code"
            :to="`/-/${space.code}`"
            class="px-2"
            style="min-height: 42px"
          >
            <v-list-item-title class="text-overline">
              <v-avatar v-if="space.image_url != null" size="24px">
                <v-img :id="`public_space_image_${space.code}`" :src="space.image_url.mini" />
              </v-avatar>
              {{ space.name }}
            </v-list-item-title>
          </component>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import { checkSearchParams } from '~/utils/search'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()

const loading = ref(true)
const alert = ref('')
const spaces = ref<any>(null)

created()
async function created () {
  await getPublicSpaces()
  loading.value = false
}

// スペース一覧取得（公開）
async function getPublicSpaces () {
  const params = { text: '', public: 1, private: 0, join: 1, nojoin: 1, active: 1, destroy: 0 }
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.spaces.listUrl, 'GET', params)

  if (response?.ok) {
    if (data != null) {
      spaces.value = data.spaces
      checkSearchParams(params, data.search_params)
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
