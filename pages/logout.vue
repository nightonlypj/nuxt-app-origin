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
  created () {
    if (!this.$auth.loggedIn) {
      this.$toasted.info('既にログアウトされています。')
      this.$auth.redirect('login')
    }
  },

  methods: {
    async logout () {
      await this.$auth.logout()
      this.$toasted.info('ログアウトしました。')
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
