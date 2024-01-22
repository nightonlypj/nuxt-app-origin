<template>
  <v-card link>
    <v-card-title>{{ $t('アカウント登録') }}</v-card-title>
    <v-card-text>
      <NuxtLink :to="localePath('/users/sign_up')">
        <v-btn color="primary">
          <v-icon>mdi-account-plus</v-icon>
          <span class="ml-1">{{ $t('無料で始める') }}</span>
        </v-btn>
      </NuxtLink>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <NuxtLink :to="localePath('/users/sign_in')" class="ml-2">{{ $t('ログイン') }}</NuxtLink>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t: $t } = useI18n()
</script>
