<template>
  <span v-if="power != null && power !== ''">
    <v-icon size="x-small">{{ ($config.public.member.powerIcon as any)[power] }}</v-icon>
    <v-tooltip activator="parent" location="bottom">
      {{ $t('「{power}」のみ表示', { power: $t(`enums.member.power.${power}`) }) }}
    </v-tooltip>
  </span>
</template>

<script setup lang="ts">
defineProps({
  power: {
    type: String,
    default: null
  }
})
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
</script>
