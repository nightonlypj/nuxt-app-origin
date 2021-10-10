<template>
  <v-card max-width="480px">
    <v-card-title>
      ログアウトします。よろしいですか？
    </v-card-title>
    <v-card-text>
      <v-btn to="/" nuxt>
        トップページ
      </v-btn>
      <v-btn color="primary" @click="logout">
        ログアウト
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  middleware: 'auth', // TODO: ログインページでnotice表示「既にログアウト済みです。」

  methods: {
    async logout () {
      await this.$auth.logout() // TODO: ログインページでnotice表示「ログアウトしました。」
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }
    }
  }
}
</script>
