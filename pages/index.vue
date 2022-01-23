<template>
  <v-row>
    <v-col v-if="!$auth.loggedIn" cols="12" md="6">
      <SignUp />
    </v-col>
    <v-col cols="12" md="6">
      <Infomations />
    </v-col>
  </v-row>
</template>

<script>
import SignUp from '~/components/index/SignUp.vue'
import Infomations from '~/components/index/Infomations.vue'

export default {
  name: 'Index',
  components: {
    SignUp,
    Infomations
  }
}
</script>
