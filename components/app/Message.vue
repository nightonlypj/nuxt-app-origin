<template>
  <v-alert v-if="alert != null" type="error" icon="mdi-alert" closable class="mb-4">{{ alert }}</v-alert>
  <v-alert v-if="notice != null" type="info" closable class="mb-4">{{ notice }}</v-alert>
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
