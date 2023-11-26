<template>
  <Head>
    <Title>テーマカラー確認</Title>
  </Head>
  <template v-if="!loading">
    <v-alert type="error" icon="mdi-alert" class="mb-2">error(mdi-alert)</v-alert><!-- NOTE: mdi-alert追加 -->
    <v-alert type="info" class="mb-2">info</v-alert>
    <v-alert type="warning" class="mb-2">warning</v-alert>
    <v-alert type="success" class="mb-2">success</v-alert>

    <v-card class="mt-2">
      <v-card-text class="pb-3">
        <div>
          <v-btn color="primary" class="mb-2 mr-2">primary</v-btn>
          <v-btn color="primary-darken-1" class="mb-2 mr-2">primary-darken-1</v-btn>
          <v-btn color="secondary" class="mb-2 mr-2">secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mb-2 mr-2">secondary-darken-1</v-btn>
          <v-btn class="mb-2 mr-2">未指定</v-btn>
          <v-btn color="accent" class="mb-2">accent (Nuxt2〜)</v-btn>
        </div>
        <div>
          <v-btn color="primary" class="mb-2 mr-2" disabled>primary</v-btn>
          <v-btn color="primary-darken-1" class="mb-2 mr-2" disabled>primary-darken-1</v-btn>
          <v-btn color="secondary" class="mb-2 mr-2" disabled>secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mb-2 mr-2" disabled>secondary-darken-1</v-btn>
          <v-btn class="mb-2 mr-2" disabled>未指定</v-btn>
          <v-btn color="accent" class="mb-2" disabled>accent (Nuxt2〜)</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
const $config = useRuntimeConfig()
const loading = ref(true)

/* c8 ignore start */
if ($config.public.env.production) {
  showError({ statusCode: 404 })
  /* c8 ignore stop */
} else {
  loading.value = false

  const { $toast } = useNuxtApp()
  $toast.error('error')
  $toast.info('info')
  $toast.warning('warning')
  $toast.success('success')
}
</script>

<style>
.Vue-Toastification__toast--error {
  background-color: rgb(var(--v-theme-error))
 }
 .Vue-Toastification__toast--info {
  background-color: rgb(var(--v-theme-info))
 }
 .Vue-Toastification__toast--warning {
  background-color: rgb(var(--v-theme-warning))
 }
 .Vue-Toastification__toast--success {
  background-color: rgb(var(--v-theme-success))
 }
</style>
