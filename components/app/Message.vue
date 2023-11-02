<template>
  <v-alert
    v-if="alert != null && alert !== ''"
    type="error"
    icon="mdi-alert"
    closable
    class="mb-4"
    @update:model-value="$emit('update:alert', '')"
  >
    {{ alert }}
  </v-alert>
  <v-alert
    v-if="notice != null && notice !== ''"
    type="info"
    closable
    class="mb-4"
    @update:model-value="$emit('update:notice', '')"
  >
    {{ notice }}
  </v-alert>
</template>

<script setup lang="ts">
defineProps({
  alert: {
    type: String,
    default: ''
  },
  notice: {
    type: String,
    default: ''
  }
})
const $emit = defineEmits(['update:alert', 'update:notice'])
</script>
