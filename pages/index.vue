<template>
  <div class="pa-1">
    <v-row>
      <v-col cols="12" md="12" class="pa-2">
        <v-card link>
          <v-card-title>
            {{ $t('サービス概要') }}
          </v-card-title>
          <v-card-subtitle class="mb-4">
            {{ $t('サービス説明') }}<br>
            {{ $t('リポジトリ') }}: <a :href="repositoryURL" target="_blank" rel="noopener noreferrer">{{ repositoryURL }}</a>
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
    <v-row v-if="$config.public.developmentMenu">
      <v-col cols="12" md="6" class="pa-2">
        <v-card link>
          <v-card-title>{{ $t('development') }}</v-card-title>
          <v-card-text>
            <v-row>
              <v-col>
                <NuxtLink :to="localePath('/development/color')">{{ $t('テーマカラー確認') }}</NuxtLink><br>
                <NuxtLink :to="localePath('/development/markdown')">{{ $t('Markdown確認') }}</NuxtLink>
              </v-col>
              <v-col>
                <NuxtLink :to="localePath('/development/autocomplete')">v-autocomplete</NuxtLink>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexInfomations from '~/components/index/Infomations.vue'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth } = useNuxtApp()

const repositoryURL = 'https://dev.azure.com/nightonly/_git/nuxt-app-origin'
</script>
