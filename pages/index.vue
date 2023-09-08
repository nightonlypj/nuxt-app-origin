<template>
  <v-row class="pt-2">
    <v-col cols="12" md="12" class="px-2 py-2">
      <v-card>
        <v-card-title>
          Nuxt.js(Vuetify)のベースアプリケーションです。（サービス概要に差し替え）
        </v-card-title>
        <v-card-text>
          サービスを迅速に立ち上げられるように、よく使う機能を予め開発しています。（サービス説明に差し替え）<br>
          リポジトリ: <a href="https://dev.azure.com/nightonly/_git/nuxt-app-origin" target="_blank" rel="noopener noreferrer">https://dev.azure.com/nightonly/_git/nuxt-app-origin</a>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col v-if="!$auth.loggedIn" cols="12" md="6" class="px-2 py-2">
      <IndexSignUp />
    </v-col>
    <v-col cols="12" md="6" class="px-2 py-2">
      <IndexInfomations />
    </v-col>
  </v-row>
</template>

<script>
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexInfomations from '~/components/index/Infomations.vue'

export default defineNuxtComponent({
  components: {
    IndexSignUp,
    IndexInfomations
  },

  head () {
    const { t: $t } = useI18n()
    const $config = useRuntimeConfig()
    return {
      titleTemplate: `${$t('app_name')}${$config.public.envName}`
    }
  }
})
</script>
