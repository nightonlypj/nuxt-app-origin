<template>
  <Head>
    <Title>{{ $t('アカウント削除') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>{{ $t('アカウント削除') }}</v-card-title>
    <v-card-text>
      <p>
        {{ $t('アカウント削除メッセージ', { days: destroyScheduleDays || 'N/A' }) }}<br>
        {{ $t('アカウント削除補足') }}
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
            {{ $t('削除') }}
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="user_delete_dialog">
            <v-toolbar color="error" density="compact">
              <span class="ml-4">{{ $t('アカウント削除') }}</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">{{ $t('アカウント削除確認メッセージ') }}</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="user_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                {{ $t('いいえ（キャンセル）') }}
              </v-btn>
              <v-btn
                id="user_delete_yes_btn"
                color="error"
                variant="elevated"
                @click="postUserDelete(isActive)"
              >
                {{ $t('はい（削除）') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <NuxtLink :to="localePath('/users/update')">{{ $t('ユーザー情報') }}</NuxtLink>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectPath, redirectSignIn } from '~/utils/redirect'
import { updateAuthUser } from '~/utils/auth'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()

const loading = ref(true)
const processing = ref(false)
const destroyScheduleDays = $auth.user?.destroy_schedule_days

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }

  if (!await updateAuthUser($t, localePath, locale.value)) { return }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath(localePath('/'), { alert: $t('auth.destroy_reserved') }) }

  loading.value = false
}

// アカウント削除
async function postUserDelete (isActive: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.userDeleteUrl), 'POST', {
    undo_delete_url: $config.public.frontBaseURL + localePath($config.public.userSendUndoDeleteUrl)
  })

  if (response?.ok) {
    if (data != null) {
      await useAuthSignOut(locale.value)
      return redirectSignIn(data, localePath)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
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
