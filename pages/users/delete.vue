<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading" max-width="640px">
      <Processing v-if="processing" />
      <v-card-title>アカウント削除</v-card-title>
      <v-card-text>
        <p>
          アカウントは{{ $auth.user.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
          削除されるまではログインできますが、一部機能が制限されます。
        </p>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn
              id="user_delete_btn"
              color="error"
              :disabled="processing"
              v-bind="attrs"
              v-on="on"
            >
              削除
            </v-btn>
          </template>
          <template #default="dialog">
            <v-card id="user_delete_dialog">
              <v-toolbar color="error" dark>アカウント削除</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">本当に削除しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  id="user_delete_no_btn"
                  color="secondary"
                  @click="dialog.value = false"
                >
                  いいえ
                </v-btn>
                <v-btn
                  id="user_delete_yes_btn"
                  color="error" @click="dialog.value = false; onUserDelete()"
                >
                  はい
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/users/edit">登録情報変更</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  mixins: [Application],

  head () {
    return {
      title: 'アカウント削除'
    }
  },

  async created () {
    // トークン検証
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      return this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true })
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    } else if (this.$auth.user.destroy_schedule_at != null) {
      return this.appRedirectDestroyReserved()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除
    async onUserDelete () {
      this.processing = true
      await this.postUserDelete()
      this.processing = false
    },

    // アカウント削除API
    async postUserDelete () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.userDeleteUrl, {
        undo_delete_url: this.$config.frontBaseURL + this.$config.userSendUndoDeleteUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSignOut(null, '/users/sign_in', response.data)
        },
        (error) => {
          this.appCheckErrorResponse(error, { toasted: true, require: true }, { auth: true })
        })
    }
  }
}
</script>
