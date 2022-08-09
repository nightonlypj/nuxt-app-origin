<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading" max-width="640px">
      <Processing v-if="processing" />
      <v-card-title>アカウント削除取り消し</v-card-title>
      <v-card-text>
        このアカウントは{{ $dateFormat($auth.user.destroy_schedule_at, 'ja') || 'N/A' }}以降に削除されます。それまでは取り消し可能です。
        <div v-if="$auth.user.destroy_requested_at != null">
          ※{{ $timeFormat($auth.user.destroy_requested_at, 'ja') }}にアカウント削除依頼を受け付けています。
        </div>
        <br>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn id="user_undo_delete_btn" color="secondary" :disabled="processing" v-bind="attrs" v-on="on">取り消し</v-btn>
          </template>
          <template #default="dialog">
            <v-card id="user_undo_delete_dialog">
              <v-toolbar color="secondary" dark>アカウント削除取り消し</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">本当に取り消しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn id="user_undo_delete_no_btn" color="secondary" @click="dialog.value = false">いいえ</v-btn>
                <v-btn id="user_undo_delete_yes_btn" color="primary" @click="dialog.value = false; onUserUndoDelete()">はい</v-btn>
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
  mixins: [Application],

  head () {
    return {
      title: 'アカウント削除取り消し'
    }
  },

  async created () {
    // トークン検証
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      if (!this.appCheckErrorResponse(error, true, { auth: true })) { return }

      return this.appRedirectTop(error.response.data, true)
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    } else if (this.$auth.user.destroy_schedule_at === null) {
      return this.appRedirectNotDestroyReserved()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除取り消し
    async onUserUndoDelete () {
      this.processing = true
      await this.postUserUndoDelete()
      this.processing = false
    },

    // アカウント削除取り消しAPI
    async postUserUndoDelete () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.userUndoDeleteUrl)
        .then((response) => {
          if (!this.appCheckResponse(response, false)) { return }

          this.$auth.setUser(response.data.user)
          if (this.$auth.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, false, { auth: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
        })
    }
  }
}
</script>
