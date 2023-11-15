<template>
  <Head>
    <Title>ユーザー情報</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="850px">
      <v-card-title>ユーザー情報</v-card-title>
      <v-row>
        <v-col cols="auto" md="4">
          <UpdateImage @messages="messages = $event" />
        </v-col>
        <v-col cols="12" md="8">
          <UpdateData :user="user" @messages="messages = $event" />
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
import { redirectAuth, redirectPath, redirectError } from '~/utils/redirect'
import { updateAuthUser } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth } = useNuxtApp()

const loading = ref(true)
const messages = ref({
  alert: '',
  notice: ''
})
const user = ref<any>(null)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }

  if (!await updateAuthUser($t)) { return }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath('/', { alert: $t('auth.destroy_reserved') }) }

  if (!await getUserDetail()) { return }

  loading.value = false
}

// ユーザー情報詳細取得
async function getUserDetail () {
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userDetailUrl)

  if (response?.ok) {
    if (data?.user != null) {
      user.value = data.user
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}
</script>
