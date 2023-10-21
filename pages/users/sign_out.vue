<template>
  <Head>
    <Title>ログアウト</Title>
  </Head>
  <v-card max-width="480px">
    <AppProcessing v-if="processing" />
    <v-card-title>ログアウトします。よろしいですか？</v-card-title>
    <v-card-text>
      <NuxtLink to="/">
        <v-btn color="secondary" class="mb-2 mr-1">
          いいえ（トップページ）
        </v-btn>
      </NuxtLink>
      <v-btn
        id="sign_out_btn"
        color="primary"
        class="mb-2"
        :disabled="processing"
        @click="signOut()"
      >
        はい（ログアウト）
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppProcessing
  },
  mixins: [Application],

  data () {
    return {
      processing: false
    }
  },

  created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAlreadySignedOut() }
  },

  methods: {
    // ログアウト
    async signOut () {
      this.processing = true
      await useAuthSignOut()
      this.appSetToastedMessage({ notice: this.$t('auth.signed_out') }, false, true)
      navigateTo(this.$config.public.authRedirectLogOutURL)
    }
  }
})
</script>
