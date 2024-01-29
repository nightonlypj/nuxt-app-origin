<template>
  <Head>
    <Title>{{ $t('ログアウト') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="480px">
    <AppProcessing v-if="processing" />
    <v-card-title>{{ $t('ログアウト確認メッセージ') }}</v-card-title>
    <v-card-text>
      <NuxtLink :to="localePath('/')">
        <v-btn color="secondary" class="mb-2 mr-1">
          {{ $t('いいえ（トップページ）') }}
        </v-btn>
      </NuxtLink>
      <v-btn
        id="sign_out_btn"
        color="primary"
        class="mb-2"
        :disabled="processing"
        @click="signOut()"
      >
        {{ $t('はい（ログアウト）') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import { redirectPath } from '~/utils/redirect'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const loading = ref(true)
const processing = ref(false)

created()
function created () {
  if (!$auth.loggedIn) { return redirectPath(localePath('/'), { notice: $t('auth.already_signed_out') }) }

  loading.value = false
}

// ログアウト
async function signOut () {
  processing.value = true
  await useAuthSignOut()
  $toast.success($t('auth.signed_out'))
  navigateTo(localePath($config.public.authRedirectLogOutURL))
}
</script>
