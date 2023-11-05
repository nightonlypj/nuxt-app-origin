<template>
  <v-alert
    v-if="messages.alert != null && messages.alert !== ''"
    type="error"
    icon="mdi-alert"
    closable
    class="mb-4"
    @update:model-value="$emit('update:messages', { ...messages, alert: '' })"
  >
    {{ messages.alert }}
  </v-alert>
  <v-alert
    v-if="messages.notice != null && messages.notice !== ''"
    type="info"
    closable
    class="mb-4"
    @update:model-value="$emit('update:messages', { ...messages, notice: '' })"
  >
    {{ messages.notice }}
  </v-alert>
</template>

<script setup lang="ts">
defineProps({
  messages: {
    type: Object,
    required: true
  }
})
const $emit = defineEmits(['update:messages'])
</script>
