<template>
  <v-card max-width="480px">
    <v-card-title>
      ログアウトします。よろしいですか？
    </v-card-title>
    <v-card-text>
      <v-btn to="/" nuxt>
        トップページ
      </v-btn>
      <v-btn color="primary" @click="signOut">
        ログアウト
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'UsersSignOut',

  created () {
    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_signed_out'))
      // return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
      return this.$router.push({ path: '/users/sign_in' }) // Tips: ログイン後、homeに戻す
    }
  },

  methods: {
    async signOut () {
      await this.$auth.logout()
      this.$toasted.info(this.$t('auth.signed_out'))
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
