<template>
  <div class="pa-1">
    <v-row>
      <v-col cols="12" md="12" class="pa-2">
        <v-card link>
          <v-card-title>
            Nuxt.js(Vue.js/Vuetify)のベースアプリケーションです。（サービス概要に差し替え）
          </v-card-title>
          <v-card-subtitle class="mb-4">
            サービスを迅速に立ち上げられるように、よく使う機能を予め開発しています。（サービス説明に差し替え）<br>
            リポジトリ: <a href="https://dev.azure.com/nightonly/_git/nuxt-app-origin" target="_blank" rel="noopener noreferrer">https://dev.azure.com/nightonly/_git/nuxt-app-origin</a>
          </v-card-subtitle>
        </v-card>
      </v-col>
      <v-col v-if="!$auth.loggedIn" cols="12" md="6" class="pa-2">
        <IndexSignUp />
      </v-col>
      <v-col cols="12" md="6" class="pa-2">
        <IndexInfomations />
      </v-col>
    </v-row>
    <v-row v-if="!$config.public.env.production">
      <v-col cols="12" md="6" class="pa-2">
        <v-card link>
          <v-card-title>development</v-card-title>
          <v-card-text>
            <NuxtLink to="/development/color">テーマカラー確認</NuxtLink>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexInfomations from '~/components/index/Infomations.vue'

const { $auth } = useNuxtApp()
</script>
