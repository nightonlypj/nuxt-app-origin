<template>
  <Head>
    <Title>スペース削除</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="850px">
    <AppProcessing v-if="processing" />
    <v-tabs v-model="tabPage" color="primary">
      <v-tab :to="spacePath">スペース</v-tab>
      <v-tab value="active">スペース削除</v-tab>
    </v-tabs>
    <v-card-title>
      <SpacesTitle :space="space" />
    </v-card-title>
    <v-card-text>
      <p>
        スペースは{{ space.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
        削除されるまではアクセスできますが、一部機能が制限されます。
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="space_delete_btn"
            color="error"
            class="mt-4"
            :disabled="processing"
          >
            削除
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="space_delete_dialog">
            <v-toolbar color="error" density="compact">
              <span class="ml-4">スペース削除</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に削除しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="space_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
              </v-btn>
              <v-btn
                id="space_delete_yes_btn"
                color="error"
                variant="elevated"
                @click="postSpacesDelete(isActive)"
              >
                はい（削除）
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <ul class="my-2">
        <li><NuxtLink :to="`/spaces/update/${code}`">スペース設定変更</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import { redirectAuth, redirectPath, redirectError } from '~/utils/redirect'
import { currentMemberAdmin } from '~/utils/members'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const tabPage = ref('active')
const space = ref<any>(null)
const code = String($route.params.code)
const spacePath = `/-/${code}`

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath(spacePath, { alert: $t('auth.destroy_reserved') }) }

  if (!await getSpacesDetail()) { return }
  if (!currentMemberAdmin.value(space.value)) { return redirectPath(spacePath, { alert: $t('auth.forbidden') }) }
  if (space.value.destroy_schedule_at != null) { return redirectPath(spacePath, { alert: $t('alert.space.destroy_reserved') }) }

  loading.value = false
}

// スペース詳細取得
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

// スペース削除
async function postSpacesDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const url = $config.public.spaces.deleteUrl.replace(':code', code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'POST')

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
      return navigateTo(spacePath)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 404) {
      $toast.error(data?.alert || $t('system.notfound'))
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }

  processing.value = false
}
</script>
