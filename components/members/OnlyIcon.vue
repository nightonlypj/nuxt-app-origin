<template>
  <span v-if="power != null">
    <v-icon size="x-small">{{ $config.public.member.powerIcon[power] }}</v-icon>
    <v-tooltip activator="parent" location="bottom">
      「{{ $t(`enums.member.power.${power}`) }}」のみ表示
    </v-tooltip>
  </span>
</template>

<script>
export default defineNuxtComponent({
  props: {
    power: {
      type: String,
      default: null
    }
  }
})
</script>
