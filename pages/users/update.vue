<template>
  <Head>
    <Title>ユーザー情報</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:alert="alert" v-model:notice="notice" />
    <v-card max-width="850px">
      <v-card-title>ユーザー情報</v-card-title>
      <v-row>
        <v-col cols="auto" md="4">
          <UpdateImage @alert="alert = $event" @notice="notice = $event" />
        </v-col>
        <v-col cols="12" md="8">
          <UpdateData :user="user" @alert="alert = $event" @notice="notice = $event" />
        </v-col>
      </v-row>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/users/delete">アカウント削除</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppMessage from '~/components/app/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import { redirectAuth, updateAuthUser, redirectDestroyReserved, redirectError } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth } = useNuxtApp()

const loading = ref(true)
const alert = ref('')
const notice = ref('')
const user = ref<any>(null)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth($t) }

  if (!await updateAuthUser($t)) { return } // NOTE: 最新の状態が削除予約済みか確認する為
  if ($auth.user.destroy_schedule_at != null) { return redirectDestroyReserved($t) }

  if (!await getUserDetail()) { return }

  loading.value = false
}

// ユーザー情報詳細取得
async function getUserDetail () {
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userDetailUrl)

  if (response?.ok) {
    if (data?.user == null) {
      redirectError(null, { alert: $t('system.error') })
    } else {
      user.value = data.user
      return true
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth($t)
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}
</script>
