<template>
  <Head>
    <Title>アカウント削除</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>アカウント削除</v-card-title>
    <v-card-text>
      <p>
        アカウントは{{ destroyScheduleDays || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
        削除されるまではログインできますが、一部機能が制限されます。
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="user_delete_btn"
            color="error"
            class="mt-4"
            :disabled="processing"
          >
            削除
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="user_delete_dialog">
            <v-toolbar color="error" density="compact">
              <span class="ml-4">アカウント削除</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に削除しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="user_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
              </v-btn>
              <v-btn
                id="user_delete_yes_btn"
                color="error"
                variant="elevated"
                @click="postUserDelete(isActive)"
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
        <li><NuxtLink to="/users/update">ユーザー情報</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import { redirectAuth, redirectPath, redirectSignIn } from '~/utils/redirect'
import { updateAuthUser } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const loading = ref(true)
const processing = ref(false)
const destroyScheduleDays = $auth.user?.destroy_schedule_days

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }

  if (!await updateAuthUser($t)) { return } // NOTE: 最新の状態が削除予約済みか確認する為
  if ($auth.user.destroy_schedule_at != null) { return redirectPath('/', { alert: $t('auth.destroy_reserved') }) }

  loading.value = false
}

// アカウント削除
async function postUserDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userDeleteUrl, 'POST', {
    undo_delete_url: $config.public.frontBaseURL + $config.public.userSendUndoDeleteUrl
  })

  if (response?.ok) {
    if (data == null) {
      $toast.error($t('system.error'))
    } else {
      await useAuthSignOut()
      return redirectSignIn(data)
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
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
