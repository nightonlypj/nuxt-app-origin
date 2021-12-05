<template>
  <v-card>
    <v-card-title>アカウント登録</v-card-title>
    <v-card-text>
      <v-btn color="primary" to="/users/sign_up" nuxt>無料で始める</v-btn>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <ul class="my-2">
        <li><NuxtLink to="/users/sign_in">ログイン</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'IndexSignUp'
}
</script>
