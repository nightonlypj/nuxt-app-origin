<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-else max-width="480px">
      <Processing v-if="processing" />
      <v-card-title>ログアウトします。よろしいですか？</v-card-title>
      <v-card-text>
        <v-btn to="/" nuxt>いいえ（トップページ）</v-btn>
        <v-btn
          id="sign_out_btn"
          class="ml-1"
          color="primary"
          :disabled="processing"
          @click="signOut()"
        >
          はい（ログアウト）
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading,
    Processing
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true
    }
  },

  head () {
    return {
      title: 'ログアウト'
    }
  },

  created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAlreadySignedOut() }

    this.processing = false
    this.loading = false
  },

  methods: {
    // ログアウト
    signOut () {
      this.processing = true
      this.appSignOut('auth.signed_out')
    }
  }
}
</script>
