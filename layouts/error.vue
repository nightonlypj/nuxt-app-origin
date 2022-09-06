<template>
  <div>
    <v-card>
      <v-card-title>{{ alert }}</v-card-title>
      <v-card-text v-if="error.notice != null">{{ error.notice }}</v-card-text>
      <v-card-actions>
        <NuxtLink to="/">トップページ</NuxtLink>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: null
    }
  },

  head () {
    return {
      title: this.title
    }
  },

  computed: {
    title () {
      return (this.error.statusCode === 404) ? 'Not Found' : 'Error'
    },
    alert () {
      if (this.error.alert == null) {
        return (this.error.statusCode === 404) ? this.$t('system.notfound') : this.$t('system.default')
      }

      return this.error.alert
    }
  },

  created () {
    // eslint-disable-next-line no-console
    if (this.$config.debug) { console.dir(this.error) }
  }
}
</script>
