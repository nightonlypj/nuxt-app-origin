<template>
  <Head>
    <Title>スペース削除</Title>
  </Head>
  <AppLoading v-if="loading" />
  <v-card v-else max-width="850px">
    <AppProcessing v-if="processing" />
    <v-tabs v-model="tabPage" color="primary">
      <v-tab :to="`/-/${$route.params.code}`">スペース</v-tab>
      <v-tab value="active">スペース削除</v-tab>
    </v-tabs>
    <v-card-title>
      <SpacesTitle :space="space" />
    </v-card-title>
    <v-card-text>
      <p>
        スペースは{{ space.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
        削除されるまではアクセスできますが、一部機能が制限されます。
      </p>
      <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            id="space_delete_btn"
            color="error"
            class="mt-4"
            :disabled="processing"
          >
            削除
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card id="space_delete_dialog">
            <v-toolbar color="error" density="compact">
              <span class="ml-4">スペース削除</span>
            </v-toolbar>
            <v-card-text>
              <div class="text-h6 pa-4">本当に削除しますか？</div>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="space_delete_no_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                いいえ（キャンセル）
              </v-btn>
              <v-btn
                id="space_delete_yes_btn"
                color="error"
                variant="elevated"
                @click="postSpacesDelete(isActive)"
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

    if (!await this.getSpacesDetail()) { return }
    if (!this.appCurrentMemberAdmin(this.space)) {
      this.appSetToastedMessage({ alert: this.$t('auth.forbidden') })
      return this.navigateToSpace()
    }
    if (this.space.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('alert.space.destroy_reserved') })
      return this.navigateToSpace()
    }

    this.loading = false
  },

  methods: {
    navigateToSpace () {
      navigateTo(`/-/${this.$route.params.code}`)
    },

    // スペース詳細取得
    async getSpacesDetail () {
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

    // スペース削除
    async postSpacesDelete (isActive) {
      this.processing = true
      isActive.value = false

      const url = this.$config.public.spaces.deleteUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST')

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
          this.navigateToSpace()
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true, forbidden: true, notfound: true, reserved: true })
      }

      this.processing = false
    }
  }
})
</script>
