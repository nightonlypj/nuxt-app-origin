<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-else max-width="640px">
      <Processing v-if="processing" />
      <v-card-title>アカウント削除取り消し</v-card-title>
      <v-card-text>
        <p>
          このアカウントは{{ $dateFormat('ja', $auth.user.destroy_schedule_at, 'N/A') }}以降に削除されます。それまでは取り消し可能です。<br>
          <template v-if="$auth.user.destroy_requested_at != null">
            （{{ $timeFormat('ja', $auth.user.destroy_requested_at) }}にアカウント削除依頼を受け付けています）
          </template>
        </p>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn
              id="user_undo_delete_btn"
              color="primary"
              :disabled="processing"
              v-bind="attrs"
              v-on="on"
            >
              取り消し
            </v-btn>
          </template>
          <template #default="dialog">
            <v-card id="user_undo_delete_dialog">
              <v-toolbar color="primary" dense>アカウント削除取り消し</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-4">本当に取り消しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  id="user_undo_delete_yes_btn"
                  color="primary"
                  @click="postUserUndoDelete(dialog)"
                >
                  はい（削除取り消し）
                </v-btn>
                <v-btn
                  id="user_undo_delete_no_btn"
                  color="secondary"
                  @click="dialog.value = false"
                >
                  いいえ（キャンセル）
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
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
      title: 'アカウント削除取り消し'
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
    if (this.$auth.user.destroy_schedule_at == null) { return this.appRedirectNotDestroyReserved() }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除取り消し
    async postUserUndoDelete ($dialog) {
      this.processing = true
      $dialog.value = false

      const [response, data] = await this.appApiRequest(this.$config.public.apiBaseURL + this.$config.public.userUndoDeleteUrl, 'POST')

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.$auth.setUser(data.user)
        if (this.$auth?.loggedIn) {
          this.appRedirectTop(data)
        } else {
          this.appRedirectSignIn(data)
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true })
      }

      this.processing = false
    }
  }
}
</script>
