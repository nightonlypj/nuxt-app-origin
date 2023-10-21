<template>
  <div class="d-flex align-center justify-center" style="height: 10vh">
    <div class="text-grey">
      続きを取得できませんでした。
      <v-btn id="error_retry_btn" color="secondary" @click="emit('retry')">再取得</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['retry'])
</script>
