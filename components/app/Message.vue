<template>
  <v-alert v-if="alert != null" type="error" icon="mdi-alert" closable>{{ alert }}</v-alert>
  <v-alert v-if="notice != null" type="info" closable>{{ notice }}</v-alert>
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
