<template>
  <v-row>
    <v-col cols="12" md="12">
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
    <v-col cols="12" md="6">
      <IndexSignUp v-if="!$auth.loggedIn" />
      <IndexSpace v-else />
      <div class="pt-4">
        <IndexPublicSpace />
      </div>
    </v-col>
    <v-col cols="12" md="6">
      <IndexInfomations />
    </v-col>
  </v-row>
  <v-row v-if="!$config.public.env.production">
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>development</v-card-title>
        <v-card-actions>
          <ul>
            <li><NuxtLink to="/development/color">テーマカラー確認</NuxtLink></li>
            <li><NuxtLink to="/development/markdown">Markdown確認</NuxtLink></li>
          </ul>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexSpace from '~/components/index/Space.vue'
import IndexPublicSpace from '~/components/index/PublicSpace.vue'
import IndexInfomations from '~/components/index/Infomations.vue'

const { $auth } = useNuxtApp()
</script>
