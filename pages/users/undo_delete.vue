<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-else max-width="640px">
      <Processing v-if="processing" />
      <v-card-title>アカウント削除取り消し</v-card-title>
      <v-card-text>
        <p>
          このアカウントは{{ $dateFormat('ja', authData.user.destroy_schedule_at, 'N/A') }}以降に削除されます。それまでは取り消し可能です。<br>
          <template v-if="authData.user.destroy_requested_at != null">
            （{{ $timeFormat('ja', authData.user.destroy_requested_at) }}にアカウント削除依頼を受け付けています）
          </template>
        </p>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              id="user_undo_delete_btn"
              color="primary"
              :disabled="processing"
            >
              取り消し
            </v-btn>
          </template>
          <template #default="{ isActive }">
            <v-card id="user_undo_delete_dialog">
              <v-toolbar color="primary" dense>アカウント削除取り消し</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-4">本当に取り消しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  id="user_undo_delete_yes_btn"
                  color="primary"
                  @click="postUserUndoDelete(isActive)"
                >
                  はい（削除取り消し）
                </v-btn>
                <v-btn
                  id="user_undo_delete_no_btn"
                  color="secondary"
                  @click="isActive.value = false"
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

const { status:authStatus, data:authData } = useAuthState()

export default {
  components: {
    Loading,
    Processing
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true,
      authData: authData.value
    }
  },

  head () {
    return {
      title: 'アカウント削除取り消し'
    }
  },

  async created () {
    if (authStatus.value !== 'authenticated') { return this.appRedirectAuth() }

    // ユーザー情報更新 // NOTE: 最新の状態が削除予約済みか確認する為
    const [response, data] = await useAuthUser()
    if (!response?.ok) {
      return this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true })
    }
    if (this.authData.user.destroy_schedule_at == null) { return this.appRedirectNotDestroyReserved() }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除取り消し
    async postUserUndoDelete (isActive) {
      this.processing = true
      isActive.value = false

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.userUndoDeleteUrl, 'POST')

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        authData.value = data
        this.appRedirectTop(data)
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true })
      }

      this.processing = false
    }
  }
}
</script>
