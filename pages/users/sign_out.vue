<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="480px">
      <v-card-title>
        ログアウトします。よろしいですか？
      </v-card-title>
      <v-card-text>
        <v-btn to="/" nuxt>
          トップページ
        </v-btn>
        <v-btn color="primary" :disabled="processing" @click="onSignOut()">
          ログアウト
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  name: 'UsersSignOut',
  mixins: [Application],

  created () {
    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_signed_out'))
      return this.$router.push({ path: '/users/sign_in' }) // Tips: ログイン後、homeに戻す
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    onSignOut () {
      this.processing = true
      this.appSignOut('auth.signed_out')
    }
  }
}
</script>
