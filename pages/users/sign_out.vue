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
        <v-btn color="primary" :disabled="processing" @click="signOut">
          ログアウト
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'

export default {
  name: 'UsersSignOut',

  components: {
    Loading
  },

  data () {
    return {
      loading: true,
      processing: true
    }
  },

  created () {
    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_signed_out'))
      return this.$router.push({ path: '/users/sign_in' }) // Tips: ログイン後、homeに戻す
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    async signOut () {
      this.processing = true

      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      this.$toasted.info(this.$t('auth.signed_out'))
    }
  }
}
</script>
