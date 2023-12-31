<template>
  <Head>
    <Title>{{ space?.name }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <SpacesDestroyInfo :space="space" />
    <v-card>
      <v-card-title>
        <v-row>
          <v-col>
            <v-avatar v-if="space.image_url != null" size="48px">
              <v-img id="space_image" :src="space.image_url.medium" />
            </v-avatar>
            {{ space.name }}
            <SpacesIcon :space="space" />
          </v-col>
          <v-col cols="12" sm="auto" class="d-flex justify-end pl-0">
            <v-btn
              v-if="space.current_member != null"
              id="members_btn"
              :to="`/members/${space.code}`"
              color="primary"
            >
              <v-badge
                :content="space.member_count"
                :model-value="space.member_count > 0"
                max="99"
                color="accent"
              >
                <v-icon size="large">mdi-account-multiple</v-icon>
              </v-badge>
              <v-tooltip activator="parent" location="bottom">メンバー一覧</v-tooltip>
            </v-btn>
            <v-btn
              v-if="currentMemberAdmin(space)"
              id="space_update_btn"
              :to="`/spaces/update/${space.code}`"
              color="secondary"
              class="ml-1"
            >
              <v-icon>mdi-cog</v-icon>
              <v-tooltip activator="parent" location="bottom">設定変更</v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="space.description != null && space.description !== ''">
        <AppMarkdown :source="space.description" />
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import { currentMemberAdmin } from '~/utils/members'
import { redirectError, redirectAuth } from '~/utils/redirect'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const $route = useRoute()

const loading = ref(true)
const space = ref<any>(null)
const code = String($route.params.code)

created()
async function created () {
  if (!await getSpacesDetail()) { return }

  loading.value = false
}

// スペース情報取得
async function getSpacesDetail () {
  const url = $config.public.spaces.detailUrl.replace(':code', code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url)

  if (response?.ok) {
    if (data?.space != null) {
      space.value = data.space
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
    } else if (response?.status === 403) {
      redirectError(403, { alert: data?.alert || $t('auth.forbidden'), notice: data?.notice })
    } else if (response?.status === 404) {
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
