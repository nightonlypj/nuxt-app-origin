<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading" max-width="480px">
      <Processing v-if="processing" />
      <v-card-title>ログアウトします。よろしいですか？</v-card-title>
      <v-card-text>
        <v-btn to="/" nuxt>トップページ</v-btn>
        <v-btn id="sign_out_btn" class="ml-1" color="primary" :disabled="processing" @click="onSignOut()">はい（ログアウト）</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  mixins: [Application],

  head () {
    return {
      title: 'ログアウト'
    }
  },

  created () {
    if (!this.$auth.loggedIn) {
      return this.appRedirectAlreadySignedOut()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // ログアウト
    onSignOut () {
      this.processing = true
      this.appSignOut('auth.signed_out')
    }
  }
}
</script>
