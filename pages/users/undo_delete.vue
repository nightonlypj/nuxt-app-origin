<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="640px">
      <Processing :processing="processing" />
      <v-card-title>アカウント削除取り消し</v-card-title>
      <v-card-text>
        このアカウントは{{ $dateFormat($auth.user.destroy_schedule_at, 'ja') }}以降に削除されます。それまでは取り消し可能です。
        <div v-if="$auth.user.destroy_requested_at != null">
          ※{{ $timeFormat($auth.user.destroy_requested_at, 'ja') }}にアカウント削除依頼を受け付けています。
        </div>
        <br>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn color="secondary" :disabled="processing" v-bind="attrs" v-on="on">取り消し</v-btn>
          </template>
          <template #default="dialog">
            <v-card>
              <v-toolbar color="secondary" dark>アカウント削除取り消し</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">本当に取り消しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn color="secondary" @click="dialog.value = false">いいえ</v-btn>
                <v-btn color="primary" @click="dialog.value = false; onUserUndoDelete()">はい</v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  name: 'UsersUndoDelete',
  mixins: [Application],

  async created () {
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      if (error.response == null) {
        this.$toasted.error(this.$t('network.failure'))
      } else if (error.response.status === 401) {
        return this.appSignOut()
      } else {
        this.$toasted.error(this.$t('network.error'))
      }
      return this.$router.push({ path: '/' })
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    }
    if (this.$auth.user.destroy_schedule_at === null) {
      this.$toasted.error(this.$t('auth.not_destroy_reserved'))
      return this.$router.push({ path: '/' })
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    async onUserUndoDelete () {
      this.processing = true

      await this.$axios.delete(this.$config.apiBaseURL + this.$config.userUndoDeleteUrl)
        .then((response) => {
          if (response.data == null) {
            this.$toasted.error(this.$t('system.error'))
          } else {
            this.$auth.setUser(response.data.user)
            return this.appRedirectSuccess(response.data.alert, response.data.notice)
          }
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.status === 401) {
            return this.appSignOut()
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.$toasted.error(error.response.data.alert)
            this.$toasted.info(error.response.data.notice)
          }
        })

      this.processing = false
    }
  }
}
</script>
