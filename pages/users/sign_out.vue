<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="480px">
      <Processing :processing="processing" />
      <v-card-title>ログアウトします。よろしいですか？</v-card-title>
      <v-card-text>
        <v-btn to="/" nuxt>トップページ</v-btn>
        <v-btn class="ml-1" color="primary" :disabled="processing" @click="onSignOut()">はい（ログアウト）</v-btn>
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
      return this.$router.push({ path: '/' })
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
