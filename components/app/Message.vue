<template>
  <div v-if="alert != null || notice != null">
    <v-alert v-if="alert != null" type="error" closable>{{ alert }}</v-alert>
    <v-alert v-if="notice != null" type="info" closable>{{ notice }}</v-alert>
  </div>
</template>

<script>
export default defineNuxtComponent({
  props: {
    alert: {
      type: String,
      default: null
    },
    notice: {
      type: String,
      default: null
    }
  }
})
</script>
