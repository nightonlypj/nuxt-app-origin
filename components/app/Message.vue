<template>
  <v-alert
    v-if="messages.alert != null && messages.alert !== ''"
    id="message_alert"
    type="error"
    icon="mdi-alert"
    closable
    class="mb-4"
    @click:close="close('alert')"
  >
    {{ messages.alert }}
  </v-alert>
  <v-alert
    v-if="messages.notice != null && messages.notice !== ''"
    id="message_notice"
    :type="noticeType"
    closable
    class="mb-4"
    @click:close="close('notice')"
  >
    {{ messages.notice }}
  </v-alert>
</template>

<script setup lang="ts">
const $props = defineProps({
  messages: {
    type: Object,
    required: true
  },
  noticeType: {
    type: String as PropType<'info' | 'success'>,
    default: 'info'
  }
})
const $emit = defineEmits(['update:messages'])

function close (key: string) {
  const messages = $props.messages
  messages[key] = ''
  $emit('update:messages', messages)
}
</script>
