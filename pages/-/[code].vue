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
            <v-badge
              v-if="space.current_member != null"
              :content="space.member_count"
              :model-value="space.member_count > 0"
              max="99"
              color="accent"
              offset-x="20"
              offset-y="2"
            >
              <v-btn
                id="members_btn"
                :to="localePath(`/members/${space.code}`)"
                color="primary"
              >
                <v-icon size="large">mdi-account-multiple</v-icon>
                {{ $t('メンバー') }}
              </v-btn>
            </v-badge>
            <v-btn
              v-if="currentMemberAdmin(space)"
              id="space_update_btn"
              :to="localePath(`/spaces/update/${space.code}`)"
              color="secondary"
              class="ml-1"
            >
              <v-icon>mdi-cog</v-icon>
              {{ $t('設定') }}
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
import { apiRequestURL } from '~/utils/api'
import { redirectError, redirectAuth } from '~/utils/redirect'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
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
  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.spaces.detailUrl.replace(':code', code)))

  if (response?.ok) {
    if (data?.space != null) {
      space.value = data.space
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
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
