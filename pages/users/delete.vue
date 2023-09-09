<template>
  <Head>
    <Title>アカウント削除</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="640px">
    <AppProcessing v-if="processing" />
    <v-card-title>アカウント削除</v-card-title>
    <v-card-text>
      <p>
        アカウントは{{ destroyScheduleDays || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
        削除されるまではログインできますが、一部機能が制限されます。
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="user_delete_btn"
            color="error"
            :disabled="processing"
          >
            削除
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="user_delete_dialog">
            <v-toolbar color="error" dense>アカウント削除</v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に削除しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="user_delete_no_btn"
                color="secondary"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
              </v-btn>
              <v-btn
                id="user_delete_yes_btn"
                color="error"
                @click="postUserDelete(isActive)"
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
      processing: true,
      destroyScheduleDays: this.$auth.user?.destroy_schedule_days
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }

    // ユーザー情報更新 // NOTE: 最新の状態が削除予約済みか確認する為
    const [response, data] = await useAuthUser()
    if (!response?.ok) {
      return this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true })
    }
    if (this.$auth.user.destroy_schedule_at != null) { return this.appRedirectDestroyReserved() }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント削除
    async postUserDelete (isActive) {
      this.processing = true
      isActive.value = false

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.userDeleteUrl, 'POST', {
        undo_delete_url: this.$config.public.frontBaseURL + this.$config.public.userSendUndoDeleteUrl
      })

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        await useAuthSignOut()
        navigateTo({ path: this.$config.public.authRedirectSignInURL, query: { alert: data.alert, notice: data.notice } })
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true, reserved: true })
      }

      this.processing = false
    }
  }
})
</script>
