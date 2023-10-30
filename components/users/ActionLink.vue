<template>
  <ul class="my-2">
    <li v-if="action !== 'sign_in'"><NuxtLink to="/users/sign_in">ログイン</NuxtLink></li>
    <li v-if="action !== 'sign_up'"><NuxtLink to="/users/sign_up">アカウント登録</NuxtLink></li>
    <li v-if="action !== 'password'"><NuxtLink to="/users/password/reset">パスワード再設定</NuxtLink></li>
    <li v-if="action !== 'confirmation'"><NuxtLink to="/users/confirmation/resend">メールアドレス確認</NuxtLink></li>
    <li v-if="action !== 'unlock'"><NuxtLink to="/users/unlock/resend">アカウントロック解除</NuxtLink></li>
  </ul>
</template>

<script setup lang="ts">
defineProps({
  action: {
    type: String,
    default: null
  }
})
</script>
