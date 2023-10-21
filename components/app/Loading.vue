<template>
  <div class="text-center">
    <v-progress-circular indeterminate color="primary" :size="50" :style="`height: ${height}`" />
  </div>
</template>

<script>
export default defineNuxtComponent({
  props: {
    height: {
      type: String,
      default: '80vh'
    }
  }
})
</script>

<style scoped>
.v-progress-circular >>> svg {
  height: 50%; /* NOTE: モバイルでヘッダアイコンが左右に動く為 */
}
</style>
