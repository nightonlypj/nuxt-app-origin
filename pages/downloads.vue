<template>
  <Head>
    <Title>ダウンロード結果</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage :alert="alert" :notice="notice" />
    <v-card>
      <v-card-title>ダウンロード結果</v-card-title>
    </v-card>
    <v-card>
      <v-card-text class="pt-0">
        <AppProcessing v-if="reloading" />
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
              <v-icon>mdi-sync</v-icon>
              <v-tooltip activator="parent" location="bottom">更新</v-tooltip>
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
          <!-- DownloadsLists
            :downloads="downloads"
            @downloads-file="downloadsFile"
          / -->
          <v-divider class="my-2" />
        </template>

        <!-- InfiniteLoading
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
        </InfiniteLoading -->
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import lodash from 'lodash'
// TODO: import InfiniteLoading from 'vue-infinite-loading'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
// TODO: import DownloadsLists from '~/components/downloads/Lists.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({

  components: {
    // InfiniteLoading,
    AppLoading,
    AppProcessing,
    AppMessage
    // DownloadsLists
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
      if (this.$config.public.debug) { console.log('reloadDownloadsList', this.reloading) }

      this.reloading = true
      this.page = 1

      await this.getDownloadsList()
      this.reloading = false
    },

    // 次頁のダウンロード結果一覧取得
    async getNextDownloadsList ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('getNextDownloadsList', this.page + 1, this.processing, this.error) }
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

      this.params = {
        id: '',
        target_id: (this.$route?.query?.target_id != null) ? Number(this.$route.query.target_id) : ''
      }
      const url = this.$config.public.downloads.listUrl + '?' + new URLSearchParams({
        ...this.params,
        page: this.page
      })
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      const redirect = this.download == null
      if (response?.ok) {
        if (this.$config.public.debug) { this.check_search_params(data.search_params) }

        if (this.page === 1) {
          this.uid = response.headers?.uid || null
        } else if (this.uid !== (response.headers?.uid || null)) {
          this.error = true
          location.reload()
          return false
        }

        this.error = !this.appCheckResponse(data, { redirect, toasted: !redirect }, data?.download?.current_page !== this.page)
        if (!this.error) {
          this.download = data.download
          if (this.reloading || this.downloads == null) {
            this.downloads = data.downloads?.slice()
          } else {
            this.downloads.push(...data.downloads)
          }

          if (this.params.target_id != null && this.page === 1 && data.target != null && data.target.last_downloaded_at == null) {
            this.appSetMessage(data.target, false)
            if (!this.reloading) {
              if (['waiting', 'processing'].includes(data.target.status)) {
                // eslint-disable-next-line no-console
                if (this.$config.public.debug) { console.log('setTimeout: checkDownloadComplete', this.params.target_id, 1) }

                this.testDelay = [1000 * 3, this.params.target_id, 1] // 3秒後
                setTimeout(this.checkDownloadComplete, ...this.testDelay)
              } else {
                this.appSetToastedMessage(data.target, false, true)
              }
            }
          }

          if (data.undownloaded_count != null && data.undownloaded_count !== this.$auth.user.undownloaded_count) {
            this.$auth.setUser({ ...this.$auth.user, undownloaded_count: data.undownloaded_count })
          }
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect, toasted: !redirect, require: true }, { auth: true })
        this.error = true
      }

      this.page = this.download?.current_page || 1
      this.processing = false
      return !this.error
    },

    // 完了チェック
    async checkDownloadComplete (targetId, count) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('checkDownloadComplete', targetId, count) }

      const index = this.downloads.findIndex(item => item.id === targetId)
      if (index < 0 || !['waiting', 'processing'].includes(this.downloads[index].status)) { // NOTE: 更新ボタンで完了になっていた場合はスキップ
        // eslint-disable-next-line no-console
        if (this.$config.public.debug) { console.log('...Skip') }

        return
      }

      this.params = {
        id: targetId,
        target_id: targetId
      }
      const url = this.$config.public.downloads.listUrl + '?' + new URLSearchParams(this.params)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.$config.public.debug) { this.check_search_params(data.search_params) }

        this.error = !this.appCheckResponse(data, { toasted: true }, data?.downloads?.length !== 1 || data.downloads[0].id !== targetId || data.target == null)
        if (this.error) { return }
        if (['waiting', 'processing'].includes(data.target.status)) {
          // eslint-disable-next-line no-console
          if (this.$config.public.debug) { console.log('setTimeout: checkDownloadComplete', targetId, count + 1) }

          this.testDelay = [1000 * (count + 1) * 3, targetId, count + 1] // 回数×3秒後（6、9、12・・・）
          setTimeout(this.checkDownloadComplete, ...this.testDelay)
          return
        }

        this.downloads.splice(index, 1, data.downloads[0])
        this.appSetMessage(data.target, false)
        this.appSetToastedMessage(data.target, false, true)
        this.$auth.setUser({ ...this.$auth.user, undownloaded_count: data.undownloaded_count })
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true })
      }
    },

    check_search_params (responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(this.params, responseParams) ? 'OK' : 'NG'), this.params, responseParams)
    },

    // ダウンロード
    async downloadsFile (item) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('downloadsFile', item) }

      const url = this.$config.public.downloads.fileUrl.replace(':id', item.id)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          const contentDisposition = response.headers != null ? response.headers['content-disposition'].match(/filename="([^"]*)"/) : []
          const blob = new Blob([data], { type: data.type })
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
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }
    }
  }
})
</script>
