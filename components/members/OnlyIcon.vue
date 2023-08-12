<template>
  <v-tooltip v-if="power != null" bottom>
    <template #activator="{ on, attrs }">
      <v-icon dense v-bind="attrs" v-on="on">{{ $config.member.powerIcon[power] }}</v-icon>
    </template>
    「{{ $t('enums.member.power')[power] }}」のみ表示
  </v-tooltip>
</template>

<script>
export default {
  props: {
    power: {
      type: String,
      default: null
    }
  }
}
</script>
