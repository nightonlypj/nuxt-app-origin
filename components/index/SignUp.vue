<template>
  <v-card link>
    <v-card-title>アカウント登録</v-card-title>
    <v-card-text>
      <NuxtLink to="/users/sign_up">
        <v-btn color="primary">
          <v-icon>mdi-account-plus</v-icon>
          <span class="ml-1">無料で始める</span>
        </v-btn>
      </NuxtLink>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <NuxtLink to="/users/sign_in" class="ml-2">ログイン</NuxtLink>
    </v-card-actions>
  </v-card>
</template>
