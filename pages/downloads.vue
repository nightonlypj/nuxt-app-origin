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
          <DownloadsLists
            :downloads="downloads"
            @downloads-file="downloadsFile"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && download != null && download.current_page < download.total_pages"
          :identifier="page"
          @infinite="getNextDownloadsList"
        >
          <template #spinner>
            <AppLoading height="10vh" class="mt-4" />
          </template>
          <template #complete />
          <template #error="{ retry }">
            <AppErrorRetry class="mt-4" @retry="error = false; retry()" />
          </template>
        </InfiniteLoading>
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import InfiniteLoading from 'v3-infinite-loading'
import AppErrorRetry from '~/components/app/ErrorRetry.vue'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import DownloadsLists from '~/components/downloads/Lists.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({

  components: {
    InfiniteLoading,
    AppErrorRetry,
    AppLoading,
    AppProcessing,
    AppMessage,
    DownloadsLists
  },
  mixins: [Application],

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
      testState: null, // Vitest用
      page: 1,
      download: null,
      downloads: null,
      testDelay: null, // Vitest用
      testElement: null // Vitest用
    }
  },

  computed: {
    existDownloads () {
      return this.downloads?.length > 0
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
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
      if (this.error) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
      if (this.processing) { return }

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

      this.params = {}
      if (this.$route?.query?.target_id != null) { this.params.target_id = Number(this.$route.query.target_id) }

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.downloads.listUrl, 'GET', {
        ...this.params,
        page: this.page
      })

      const redirect = this.download == null
      if (response?.ok) {
        if (this.page === 1) {
          this.uid = response.headers.get('uid')
        } else if (this.uid !== response.headers.get('uid')) {
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
            this.$auth.updateUserUndownloadedCount(data.undownloaded_count)
          }
          this.appCheckSearchParams(this.params, data.search_params)
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
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.downloads.listUrl, 'GET', this.params)

      if (response?.ok) {
        this.error = !this.appCheckResponse(data, { toasted: true }, data?.downloads?.length !== 1 || data.downloads[0].id !== targetId || data.target == null)
        if (!this.error) {
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
          this.$auth.updateUserUndownloadedCount(data.undownloaded_count)
          this.appCheckSearchParams(this.params, data.search_params)
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { toasted: true, require: true }, { auth: true })
      }
    },

    // ダウンロード
    async downloadsFile (item) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('downloadsFile', item) }

      const url = this.$config.public.downloads.fileUrl.replace(':id', item.id)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'GET', null, null, 'text/csv')

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          const element = document.createElement('a')
          element.href = (window.URL || window.webkitURL).createObjectURL(data)

          const contentDisposition = response.headers.get('content-disposition').match(/filename="([^"]*)"/) || []
          if (contentDisposition.length >= 2) { element.download = contentDisposition[1] }

          document.body.appendChild(element)
          element.click()
          document.body.removeChild(element)
          this.testElement = element

          if (item.last_downloaded_at == null) {
            const index = this.downloads.indexOf(item)
            if (index >= 0) {
              item.last_downloaded_at = true
              this.downloads.splice(index, 1, item)
            }

            if (item.id === Number(this.$route?.query?.target_id)) { this.notice = null }

            if (this.$auth.user?.undownloaded_count > 0) {
              this.$auth.updateUserUndownloadedCount(this.$auth.user.undownloaded_count - 1)
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
