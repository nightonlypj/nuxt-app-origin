<template>
  <Head>
    <Title>アカウント削除取り消し</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>アカウント削除取り消し</v-card-title>
    <v-card-text>
      <p>
        このアカウントは{{ $dateFormat('ja', $auth.user.destroy_schedule_at, 'N/A') }}以降に削除されます。それまでは取り消し可能です。<br>
        <template v-if="$auth.user.destroy_requested_at != null">
          （{{ $timeFormat('ja', $auth.user.destroy_requested_at) }}にアカウント削除依頼を受け付けています）
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
</template>

<script>
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading,
    AppProcessing
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }

    // ユーザー情報更新 // NOTE: 最新の状態が削除予約済みか確認する為
    const [response, data] = await useAuthUser()
    if (!response?.ok) {
      return this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true })
    }
    if (this.$auth.user.destroy_schedule_at == null) { return this.appRedirectNotDestroyReserved() }

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

        this.$auth.setData(data)
        this.appRedirectTop(data)
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true })
      }

      this.processing = false
    }
  }
})
</script>
