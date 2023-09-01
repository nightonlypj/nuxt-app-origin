<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-else max-width="640px">
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
              <v-toolbar color="error" dense>アカウント削除</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-4">本当に削除しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  id="user_delete_no_btn"
                  color="secondary"
                  @click="dialog.value = false"
                >
                  いいえ（キャンセル）
                </v-btn>
                <v-btn
                  id="user_delete_yes_btn"
                  color="error"
                  @click="postUserDelete(dialog)"
                >
                  はい（削除）
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/users/update">ユーザー情報</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Application from '~/utils/application.js'

export default {
  components: {
    Loading,
    Processing
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true
    }
  },

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
      return this.appCheckErrorResponse(null, error, { redirect: true, require: true }, { auth: true })
    }

    if (!this.$auth?.loggedIn) { return this.appRedirectAuth() }
    if (this.$auth.user.destroy_schedule_at != null) { return this.appRedirectDestroyReserved() }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除
    async postUserDelete ($dialog) {
      this.processing = true
      $dialog.value = false

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.userDeleteUrl, 'POST',
        JSON.stringify({
          undo_delete_url: this.$config.public.frontBaseURL + this.$config.public.userSendUndoDeleteUrl
        })
      )

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.appSignOut(null, '/users/sign_in', data)
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true, reserved: true })
      }

      this.processing = false
    }
  }
}
</script>
