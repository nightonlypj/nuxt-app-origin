<template>
  <Head>
    <Title>{{ $t('アカウント削除取り消し') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>{{ $t('アカウント削除取り消し') }}</v-card-title>
    <v-card-text>
      <p>
        {{ $t('アカウント削除取り消しメッセージ', { destroy_schedule_at: dateFormat(locale, $auth.user.destroy_schedule_at, 'N/A') }) }}<br>
        <template v-if="$auth.user.destroy_requested_at != null">
          {{ $t('アカウント削除取り消し補足', { destroy_requested_at: dateTimeFormat(locale, $auth.user.destroy_requested_at) }) }}
        </template>
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="user_undo_delete_btn"
            color="primary"
            class="mt-4"
            :disabled="processing"
          >
            {{ $t('取り消し') }}
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="user_undo_delete_dialog">
            <v-toolbar color="primary" density="compact">
              <span class="ml-4">{{ $t('アカウント削除取り消し') }}</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">{{ $t('取り消し確認メッセージ') }}</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="user_undo_delete_yes_btn"
                color="primary"
                variant="elevated"
                @click="postUserUndoDelete(isActive)"
              >
                {{ $t('はい（削除取り消し）') }}
              </v-btn>
              <v-btn
                id="user_undo_delete_no_btn"
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
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import { dateFormat, dateTimeFormat } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectPath } from '~/utils/redirect'
import { updateAuthUser } from '~/utils/auth'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()

const loading = ref(true)
const processing = ref(false)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }

  if (!await updateAuthUser($t, localePath, locale.value)) { return }
  if ($auth.user.destroy_schedule_at == null) { return redirectPath(localePath('/'), { alert: $t('auth.not_destroy_reserved') }) }

  loading.value = false
}

// アカウント削除取り消し
async function postUserUndoDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.userUndoDeleteUrl), 'POST')

  if (response?.ok) {
    if (data != null) {
      $auth.setData(data)
      return redirectPath(localePath('/'), data, true)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
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
