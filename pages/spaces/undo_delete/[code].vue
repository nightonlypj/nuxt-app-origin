<template>
  <Head>
    <Title>スペース削除取り消し</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="850px">
    <AppProcessing v-if="processing" />
    <v-tabs v-model="tabPage" color="primary">
      <v-tab :to="`/-/${$route.params.code}`">スペース</v-tab>
      <v-tab value="active">スペース削除取り消し</v-tab>
    </v-tabs>
    <v-card-title>
      <SpacesTitle :space="space" />
    </v-card-title>
    <v-card-text>
      <p>
        このスペースは{{ $dateFormat('ja', space.destroy_schedule_at, 'N/A') }}以降に削除されます。それまでは取り消し可能です。<br>
        <template v-if="space.destroy_requested_at != null">
          （{{ $timeFormat('ja', space.destroy_requested_at) }}にスペース削除依頼を受け付けています）
        </template>
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="space_undo_delete_btn"
            color="primary"
            class="mt-4"
            :disabled="processing"
          >
            取り消し
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="space_undo_delete_dialog">
            <v-toolbar color="primary" density="compact">
              <span class="ml-4">スペース削除取り消し</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に取り消しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="space_undo_delete_yes_btn"
                color="primary"
                variant="elevated"
                @click="postSpacesUndoDelete(isActive)"
              >
                はい（削除取り消し）
              </v-btn>
              <v-btn
                id="space_undo_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <ul class="my-2">
        <li><NuxtLink :to="`/spaces/update/${$route.params.code}`">スペース設定変更</NuxtLink></li>
      </ul>
    </v-card-actions>
  </v-card>
</template>

<script>
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading,
    AppProcessing,
    SpacesTitle
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: false,
      tabPage: 'active',
      space: null
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
    if (this.$auth.user.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') })
      return this.navigateToSpace()
    }

    if (!await this.getSpaceDetail()) { return }
    if (!this.appCurrentMemberAdmin(this.space)) {
      this.appSetToastedMessage({ alert: this.$t('auth.forbidden') })
      return this.navigateToSpace()
    }
    if (this.space.destroy_schedule_at == null) {
      this.appSetToastedMessage({ alert: this.$t('alert.space.not_destroy_reserved') })
      return this.navigateToSpace()
    }

    this.loading = false
  },

  methods: {
    navigateToSpace () {
      navigateTo(`/-/${this.$route.params.code}`)
    },

    // スペース詳細取得
    async getSpaceDetail () {
      const url = this.$config.public.spaces.detailUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { redirect: true }, data?.space == null)) {
          this.space = data.space
          return true
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }

      return false
    },

    // スペース削除取り消し
    async postSpacesUndoDelete (isActive) {
      this.processing = true
      isActive.value = false

      const url = this.$config.public.spaces.undoDeleteUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST')

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
          this.navigateToSpace()
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true, forbidden: true, notfound: true, reserved: true })) {
        return this.navigateToSpace()
      }

      this.processing = false
    }
  }
})
</script>
