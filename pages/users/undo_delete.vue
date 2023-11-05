<template>
  <Head>
    <Title>アカウント削除取り消し</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>アカウント削除取り消し</v-card-title>
    <v-card-text>
      <p>
        このアカウントは{{ dateFormat('ja', $auth.user.destroy_schedule_at, 'N/A') }}以降に削除されます。それまでは取り消し可能です。<br>
        <template v-if="$auth.user.destroy_requested_at != null">
          （{{ dateTimeFormat('ja', $auth.user.destroy_requested_at) }}にアカウント削除依頼を受け付けています）
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
            取り消し
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="user_undo_delete_dialog">
            <v-toolbar color="primary" density="compact">
              <span class="ml-4">アカウント削除取り消し</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に取り消しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="user_undo_delete_yes_btn"
                color="primary"
                variant="elevated"
                @click="postUserUndoDelete(isActive)"
              >
                はい（削除取り消し）
              </v-btn>
              <v-btn
                id="user_undo_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
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
import { redirectAuth, redirectPath } from '~/utils/redirect'
import { updateAuthUser } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const loading = ref(true)
const processing = ref(false)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }

  if (!await updateAuthUser($t)) { return } // NOTE: 最新の状態が削除予約済みか確認する為
  if ($auth.user.destroy_schedule_at == null) { return redirectPath('/', { alert: $t('auth.not_destroy_reserved') }) }

  loading.value = false
}

// アカウント削除取り消し
async function postUserUndoDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userUndoDeleteUrl, 'POST')

  if (response?.ok) {
    if (data == null) {
      $toast.error($t('system.error'))
    } else {
      $auth.setData(data)
      return redirectPath('/', data, true)
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
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
