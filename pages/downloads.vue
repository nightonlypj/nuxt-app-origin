<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card>
        <v-card-title>ダウンロード結果</v-card-title>
      </v-card>
      <v-card>
        <v-card-text class="pt-0">
          <Processing v-if="reloading" />
          <v-row>
            <v-col class="d-flex align-self-center text-no-wrap">
              {{ $localeString('ja', download.total_count, 'N/A') }}件
            </v-col>
            <v-col class="d-flex justify-end">
              <v-btn
                id="downloads_reload_btn"
                color="secondary"
                :disabled="processing || reloading"
                @click="reloadDownloadsList()"
              >
                <v-tooltip bottom>
                  <template #activator="{ on: tooltip }">
                    <v-icon small v-on="tooltip">mdi-sync</v-icon>
                  </template>
                  更新
                </v-tooltip>
              </v-btn>
            </v-col>
          </v-row>

          <template v-if="!existDownloads">
            <v-divider class="my-4" />
            <span class="ml-1">ダウンロード結果が見つかりません。</span>
            <v-divider class="my-4" />
          </template>
          <template v-if="existDownloads">
            <v-divider class="my-2" />
            <DownloadsLists
              :downloads="downloads"
              @downloadsFile="downloadsFile"
            />
            <v-divider class="my-2" />
          </template>

          <InfiniteLoading
            v-if="!reloading && download != null && download.current_page < download.total_pages"
            :identifier="page"
            @infinite="getNextDownloadsList"
          >
            <div slot="no-more" />
            <div slot="no-results" />
            <div slot="error" slot-scope="{ trigger }">
              取得できませんでした。
              <v-btn @click="error = false; trigger()">再取得</v-btn>
            </div>
          </InfiniteLoading>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script>
import lodash from 'lodash'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import DownloadsLists from '~/components/downloads/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Message,
    Processing,
    DownloadsLists
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    return {
      loading: true,
      processing: true,
      reloading: false,
      alert: null,
      notice: null,
      params: null,
      uid: null,
      error: false,
      testState: null, // Jest用
      page: 1,
      download: null,
      downloads: null,
      testDelay: null // Jest用
    }
  },

  head () {
    return {
      title: 'ダウンロード結果'
    }
  },

  computed: {
    existDownloads () {
      return this.downloads?.length > 0
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (!await this.getDownloadsList()) { return }

    this.loading = false
  },

  methods: {
    // ダウンロード結果一覧再取得
    async reloadDownloadsList () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('reloadDownloadsList', this.reloading) }

      this.reloading = true
      this.page = 1

      await this.getDownloadsList()
      this.reloading = false
    },

    // 次頁のダウンロード結果一覧取得
    async getNextDownloadsList ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('getNextDownloadsList', this.page + 1, this.processing, this.error) }
      if (this.processing || this.error) { return }

      this.page = this.download.current_page + 1
      if (!await this.getDownloadsList()) {
        if ($state == null) { this.testState = 'error'; return }

        $state.error()
      } else if (this.download.current_page < this.download.total_pages) {
        if ($state == null) { this.testState = 'loaded'; return }

        $state.loaded()
      } else {
        if ($state == null) { this.testState = 'complete'; return }

        $state.complete()
      }
    },

    // ダウンロード結果一覧取得
    async getDownloadsList () {
      this.processing = true
      let result = false

      this.params = {
        id: null,
        target_id: (this.$route?.query?.target_id != null) ? Number(this.$route.query.target_id) : null
      }
      const redirect = this.download == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.downloads.listUrl, {
        params: {
          ...this.params,
          page: this.page
        }
      })
        .then((response) => {
          if (this.$config.debug) { this.check_search_params(response.data.search_params) }

          if (this.page === 1) {
            this.uid = response.headers?.uid || null
          } else if (this.uid !== (response.headers?.uid || null)) {
            this.error = true
            location.reload()
            return
          }

          this.error = !this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.download?.current_page !== this.page)
          if (this.error) { return }

          this.download = response.data.download
          if (this.reloading || this.downloads == null) {
            this.downloads = response.data.downloads?.slice()
          } else {
            this.downloads.push(...response.data.downloads)
          }

          if (this.params.target_id != null && this.page === 1 && response.data.target != null && response.data.target.last_downloaded_at == null) {
            this.appSetMessage(response.data.target, false)
            if (!this.reloading) {
              if (['waiting', 'processing'].includes(response.data.target.status)) {
                // eslint-disable-next-line no-console
                if (this.$config.debug) { console.log('setTimeout: checkDownloadComplete', this.params.target_id, 1) }

                this.testDelay = [1000 * 3, this.params.target_id, 1] // 3秒後
                setTimeout(this.checkDownloadComplete, ...this.testDelay)
              } else {
                this.appSetToastedMessage(response.data.target, false)
              }
            }
          }

          if (response.data.undownloaded_count != null && response.data.undownloaded_count !== this.$auth.user.undownloaded_count) {
            this.$auth.setUser({ ...this.$auth.user, undownloaded_count: response.data.undownloaded_count })
          }

          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true }, { auth: true })
          this.error = true
        })

      this.page = this.download?.current_page || 1
      this.processing = false
      return result
    },

    // 完了チェック
    async checkDownloadComplete (targetId, count) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('checkDownloadComplete', targetId, count) }

      const index = this.downloads.findIndex(item => item.id === targetId)
      if (index < 0 || !['waiting', 'processing'].includes(this.downloads[index].status)) { // NOTE: 更新ボタンで完了になっていた場合はスキップ
        // eslint-disable-next-line no-console
        if (this.$config.debug) { console.log('...Skip') }

        return
      }

      this.params = {
        id: targetId,
        target_id: targetId
      }
      await this.$axios.get(this.$config.apiBaseURL + this.$config.downloads.listUrl, { params: this.params })
        .then((response) => {
          if (this.$config.debug) { this.check_search_params(response.data.search_params) }

          this.error = !this.appCheckResponse(response, { toasted: true }, response.data?.downloads?.length !== 1 || response.data.downloads[0].id !== targetId || response.data.target == null)
          if (this.error) { return }
          if (['waiting', 'processing'].includes(response.data.target.status)) {
            // eslint-disable-next-line no-console
            if (this.$config.debug) { console.log('setTimeout: checkDownloadComplete', targetId, count + 1) }

            this.testDelay = [1000 * (count + 1) * 3, targetId, count + 1] // 回数×3秒後（6、9、12・・・）
            setTimeout(this.checkDownloadComplete, ...this.testDelay)
            return
          }

          this.downloads.splice(index, 1, response.data.downloads[0])
          this.appSetMessage(response.data.target, false)
          this.appSetToastedMessage(response.data.target, false)
          this.$auth.setUser({ ...this.$auth.user, undownloaded_count: response.data.undownloaded_count })
        },
        (error) => {
          this.appCheckErrorResponse(error, { toasted: true, require: true }, { auth: true })
        })
    },

    check_search_params (responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(this.params, responseParams) ? 'OK' : 'NG'), this.params, responseParams)
    },

    // ダウンロード
    async downloadsFile (item) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('downloadsFile', item) }

      await this.$axios.get(this.$config.apiBaseURL + this.$config.downloads.fileUrl.replace(':id', item.id), { responseType: 'blob' })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          const contentDisposition = response.headers != null ? response.headers['content-disposition'].match(/filename="([^"]*)"/) : []
          const blob = new Blob([response.data], { type: response.data.type })
          const element = document.createElement('a')
          element.href = (window.URL || window.webkitURL).createObjectURL(blob)
          if (contentDisposition.length >= 2) { element.download = contentDisposition[1] }
          document.body.appendChild(element)
          if (process.env.NODE_ENV !== 'test') { // NOTE: Jest -> Error: Not implemented: navigation (except hash changes)
            element.click()
          }
          document.body.removeChild(element)

          if (item.last_downloaded_at == null) {
            const index = this.downloads.indexOf(item)
            if (index >= 0) {
              item.last_downloaded_at = true
              this.downloads.splice(index, 1, item)
            }

            if (item.id === Number(this.$route?.query?.target_id)) { this.notice = null }

            if (this.$auth.user?.undownloaded_count > 0) {
              this.$auth.setUser({ ...this.$auth.user, undownloaded_count: this.$auth.user.undownloaded_count - 1 })
            }
          }
        },
        (error) => {
          this.appCheckErrorResponse(error, { toasted: true, require: true }, { auth: true, forbidden: true, notfound: true })
        })
    }
  }
}
</script>
