<template>
  <Head>
    <Title>{{ $t('スペース削除取り消し') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="850px">
    <AppProcessing v-if="processing" />
    <v-tabs v-if="!$config.public.env.test" v-model="tabPage" color="primary">
      <v-tab :to="spacePath">{{ $t('スペース') }}</v-tab>
      <v-tab value="active">{{ $t('スペース削除取り消し') }}</v-tab>
    </v-tabs>
    <v-card-title>
      <SpacesTitle :space="space" />
    </v-card-title>
    <v-card-text>
      <p>
        {{ $t('スペース削除取り消しメッセージ', { date: dateFormat(locale, space.destroy_schedule_at, 'N/A') }) }}<br>
        <template v-if="space.destroy_requested_at != null">
          {{ $t('スペース削除取り消し補足', { date: dateTimeFormat(locale, space.destroy_requested_at) }) }}
        </template>
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="space_undo_delete_btn"
            color="primary"
            class="mt-4"
            :disabled="processing"
          >
            {{ $t('取り消し') }}
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="space_undo_delete_dialog">
            <v-toolbar color="primary" density="compact">
              <span class="ml-4">{{ $t('スペース削除取り消し') }}</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">{{ $t('スペース削除取り消し確認メッセージ') }}</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="space_undo_delete_yes_btn"
                color="primary"
                variant="elevated"
                @click="postSpacesUndoDelete(isActive)"
              >
                {{ $t('はい（削除取り消し）') }}
              </v-btn>
              <v-btn
                id="space_undo_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                {{ $t('いいえ（キャンセル）') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <NuxtLink :to="localePath(`/spaces/update/${code}`)" class="ml-2">{{ $t('スペース設定') }}</NuxtLink>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import { dateFormat, dateTimeFormat } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectPath, redirectError } from '~/utils/redirect'
import { currentMemberAdmin } from '~/utils/members'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const tabPage = ref('active')
const space = ref<any>(null)
const code = String($route.params.code)
const spacePath = localePath(`/-/${code}`)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath(spacePath, { alert: $t('auth.destroy_reserved') }) }

  if (!await getSpaceDetail()) { return }
  if (!currentMemberAdmin.value(space.value)) { return redirectPath(spacePath, { alert: $t('auth.forbidden') }) }
  if (space.value.destroy_schedule_at == null) { return redirectPath(spacePath, { alert: $t('alert.space.not_destroy_reserved') }) }

  loading.value = false
}

// スペース詳細取得
async function getSpaceDetail () {
  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.spaces.detailUrl.replace(':code', code)))

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

// スペース削除取り消し
async function postSpacesUndoDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.spaces.undoDeleteUrl.replace(':code', code)), 'POST')

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      await useAuthUser(locale.value) // NOTE: 左メニューの参加スペース更新の為
      return navigateTo(spacePath)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
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
