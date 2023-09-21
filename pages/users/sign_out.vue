<template>
  <Head>
    <Title>ログアウト</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="480px">
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
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading,
    AppProcessing
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true
    }
  },

  created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAlreadySignedOut() }

    this.processing = false
    this.loading = false
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
