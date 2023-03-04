<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-else max-width="850px">
      <Processing v-if="processing" />
      <v-tabs v-model="tabPage">
        <v-tab :to="`/-/${$route.params.code}`" nuxt>スペース</v-tab>
        <v-tab href="#active">スペース削除</v-tab>
      </v-tabs>
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
      <v-card-text>
        <p>
          スペースは{{ space.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
          削除されるまではアクセスできますが、一部機能が制限されます。
        </p>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn
              id="space_delete_btn"
              color="error"
              :disabled="processing"
              v-bind="attrs"
              v-on="on"
            >
              削除
            </v-btn>
          </template>
          <template #default="dialog">
            <v-card id="space_delete_dialog">
              <v-toolbar color="error" dense dark>スペース削除</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-4">本当に削除しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  id="space_delete_no_btn"
                  color="secondary"
                  @click="dialog.value = false"
                >
                  いいえ
                </v-btn>
                <v-btn
                  id="space_delete_yes_btn"
                  color="error"
                  @click="postSpacesDelete(dialog)"
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
          <li><NuxtLink :to="`/spaces/update/${$route.params.code}`">スペース設定変更</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading,
    Processing,
    SpacesTitle
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    return {
      loading: true,
      processing: false,
      tabPage: 'active',
      space: null
    }
  },

  head () {
    return {
      title: 'スペース削除'
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (this.$auth.user.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }

    if (!await this.getSpacesDetail()) { return }
    if (!this.appCurrentMemberAdmin(this.space)) {
      this.appSetToastedMessage({ alert: this.$t('auth.forbidden') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }
    if (this.space.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('alert.space.destroy_reserved') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }

    this.loading = false
  },

  methods: {
    // スペース詳細取得
    async getSpacesDetail () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaces.detailUrl.replace(':code', this.$route.params.code))
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true }, response.data?.space == null)) { return }

          this.space = response.data.space
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
        })

      return result
    },

    // スペース削除
    async postSpacesDelete ($dialog) {
      this.processing = true
      $dialog.value = false

      await this.$axios.post(this.$config.apiBaseURL + this.$config.spaces.deleteUrl.replace(':code', this.$route.params.code))
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$auth.fetchUser() // NOTE: 左メニューの参加スペース更新の為
          this.$router.push({ path: `/-/${this.$route.params.code}` })
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true, require: true }, { auth: true, forbidden: true, notfound: true, reserved: true })) { return }

          return this.$router.push({ path: `/-/${this.$route.params.code}` })
        })

      this.processing = false
    }
  }
}
</script>
