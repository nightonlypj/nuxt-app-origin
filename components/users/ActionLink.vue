<template>
  <ul class="my-2">
    <li v-if="action !== 'sign_in'"><NuxtLink :to="localePath('/users/sign_in')">{{ $t('ログイン') }}</NuxtLink></li>
    <li v-if="action !== 'sign_up'"><NuxtLink :to="localePath('/users/sign_up')">{{ $t('アカウント登録') }}</NuxtLink></li>
    <li v-if="action !== 'password'"><NuxtLink :to="localePath('/users/password/reset')">{{ $t('パスワード再設定') }}</NuxtLink></li>
    <li v-if="action !== 'confirmation'"><NuxtLink :to="localePath('/users/confirmation/resend')">{{ $t('メールアドレス確認') }}</NuxtLink></li>
    <li v-if="action !== 'unlock'"><NuxtLink :to="localePath('/users/unlock/resend')">{{ $t('アカウントロック解除') }}</NuxtLink></li>
  </ul>
</template>

<script setup lang="ts">
defineProps({
  action: {
    type: String,
    required: true
  }
})
const localePath = useLocalePath()
const { t: $t } = useI18n()
</script>
