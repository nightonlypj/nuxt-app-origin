<template>
  <v-row>
    <v-col v-if="!$auth.loggedIn" cols="12" md="6">
      <IndexSignUp />
    </v-col>
    <v-col cols="12" md="6">
      <IndexInfomations />
    </v-col>
  </v-row>
</template>

<script>
import IndexSignUp from '~/components/index/SignUp.vue'
import IndexInfomations from '~/components/index/Infomations.vue'

export default {
  components: {
    IndexSignUp,
    IndexInfomations
  },

  head () {
    return {
      titleTemplate: this.$t('app_name') + this.$config.envName
    }
  }
}
</script>
