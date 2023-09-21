<template>
  <v-card>
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
      <ul class="my-2">
        <li><NuxtLink to="/users/sign_in">ログイン</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>
