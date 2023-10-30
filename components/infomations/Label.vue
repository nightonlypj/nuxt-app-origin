<template>
  <v-chip
    v-if="infomation != null && infomation.label !== 'not'"
    :color="labelColor"
    size="small"
    variant="elevated"
  >
    {{ infomation.label_i18n }}
  </v-chip>
</template>

<script setup lang="ts">
const $props = defineProps({
  infomation: {
    type: Object,
    default: null
  }
})

const labelColor = computed(() => {
  if ($props.infomation.label === 'maintenance') { return 'error' }
  if ($props.infomation.label === 'hindrance') { return 'warning' }
  return 'info'
})
</script>
