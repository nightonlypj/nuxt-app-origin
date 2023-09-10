<template>
  <template v-if="!loading">
    <!-- v-alert type="error" class="mt-2">error</v-alert -->
    <v-alert type="error" icon="mdi-alert" class="mt-2">error(mdi-alert)</v-alert>
    <v-alert type="info" class="mt-2">info</v-alert>
    <v-alert type="warning" class="mt-2">warning</v-alert>
    <v-alert type="success" class="mt-2">success</v-alert>

    <v-card class="mt-4">
      <v-card-text>
        <div>
          <v-btn color="primary" class="mr-2">primary</v-btn>
          <v-btn color="primary-darken-1" class="mr-2">primary-darken-1</v-btn>
          <v-btn color="secondary" class="mr-2">secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mr-2">secondary-darken-1</v-btn>
          <v-btn class="mr-2">未指定</v-btn>
          <v-btn color="accent">accent (Nuxt2〜)</v-btn>
        </div>
        <div class="mt-2">
          <v-btn color="primary" class="mr-2" disabled>primary</v-btn>
          <v-btn color="primary-darken-1" class="mr-2" disabled>primary-darken-1</v-btn>
          <v-btn color="secondary" class="mr-2" disabled>secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mr-2" disabled>secondary-darken-1</v-btn>
          <v-btn class="mr-2" disabled>未指定</v-btn>
          <v-btn color="accent" disabled>accent (Nuxt2〜)</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(true)
if (process.env.NODE_ENV === 'production') {
  showError({ statusCode: 404 })
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
