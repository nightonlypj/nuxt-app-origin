<template>
  <v-dialog max-width="720px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="download_btn"
        color="secondary"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-tooltip bottom :disabled="$vuetify.breakpoint.width >= 960">
          <template #activator="{ on: tooltip }">
            <v-icon small v-on="tooltip">mdi-download</v-icon>
            <span class="hidden-sm-and-down ml-1">ダウンロード</span>
          </template>
          ダウンロード
        </v-tooltip>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="download_dialog">
        <validation-observer v-slot="{ invalid }" ref="observer">
          <Processing v-if="processing" />
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense dark>
              <v-icon dense>mdi-download</v-icon>
              <span class="ml-1">ダウンロード</span>
            </v-toolbar>
            <v-card-text>
              <v-container class="pt-0">
                <v-row>
                  <!-- 左側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>対象</h4>
                    <validation-provider v-slot="{ errors }" name="target" rules="required_select">
                      <v-radio-group
                        v-model="query.target"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(label, key) in targets"
                          :id="`download_target_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          :disabled="!enableTarget.includes(key)"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">形式</h4>
                    <validation-provider v-slot="{ errors }" name="format" rules="required_select">
                      <v-radio-group
                        v-model="query.format"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(label, key) in formats"
                          :id="`download_format_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">文字コード</h4>
                    <validation-provider v-slot="{ errors }" name="char_code" rules="required_select">
                      <v-radio-group
                        v-model="query.char_code"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(label, key) in charCodes"
                          :id="`download_char_code_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">改行コード</h4>
                    <validation-provider v-slot="{ errors }" name="newline_code" rules="required_select">
                      <v-radio-group
                        v-model="query.newline_code"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(label, key) in newlineCodes"
                          :id="`download_newline_code_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                  </v-col>
                  <!-- 右側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>
                      出力項目
                      <v-btn small :disabled="outputItems.length >= items.length" class="ml-4" @click="setAllOutputItems()">全選択</v-btn>
                      <v-btn small :disabled="outputItems.length === 0" @click="clearOutputItems()">全解除</v-btn>
                    </h4>
                    <validation-provider v-slot="{ errors }" name="output_items" rules="required_select">
                      <template v-for="(item, index) in items">
                        <v-switch
                          :id="`download_output_item_${item.value.replace('.', '_')}`"
                          :key="item.value"
                          v-model="outputItems"
                          color="primary"
                          :label="item.text"
                          :value="item.value"
                          :hide-details="index + 1 < items.length ? 'true' : 'auto'"
                          :error-messages="errors"
                          dense
                          class="mt-1"
                          @change="waiting = false"
                        />
                      </template>
                    </validation-provider>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="download_submit_btn"
                color="primary"
                :disabled="processing || invalid || waiting"
                @click="postDownloadCreate(dialog)"
              >
                ダウンロード
              </v-btn>
              <v-btn
                id="download_cancel_btn"
                color="secondary"
                @click="dialog.value = false"
              >
                キャンセル
              </v-btn>
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

extend('required_select', required)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing
  },
  mixins: [Application],

  props: {
    admin: {
      type: Boolean,
      default: null
    },
    model: {
      type: String,
      required: true
    },
    space: {
      type: Object,
      default: null
    },
    hiddenItems: {
      type: Array,
      required: true
    },
    selectItems: {
      type: Array,
      default: null
    },
    searchParams: {
      type: Object,
      default: null
    }
  },

  data () {
    return {
      processing: false,
      waiting: null,
      query: null,
      outputItems: null,
      enableTarget: null
    }
  },

  computed: {
    items () {
      return this.$t(`items.${this.model}`).filter(item => !item.adminOnly || this.admin)
    },
    targets () {
      return this.$t('enums.download.target')
    },
    formats () {
      return this.$t('enums.download.format')
    },
    charCodes () {
      return this.$t('enums.download.char_code')
    },
    newlineCodes () {
      return this.$t('enums.download.newline_code')
    }
  },

  methods: {
    initialize () {
      this.waiting = false
      this.query = {
        target: null,
        format: localStorage.getItem('download.format'),
        char_code: localStorage.getItem('download.char_code'),
        newline_code: localStorage.getItem('download.newline_code')
      }
      this.outputItems = this.items.filter(item => !this.hiddenItems.includes(item.value)).map(item => item.value)

      this.enableTarget = []
      if (this.selectItems != null && this.selectItems.length > 0) { this.enableTarget.push('select') }
      if (this.searchParams != null && Object.keys(this.searchParams).length > 0) { this.enableTarget.push('search') }
      this.enableTarget.push('all')

      if (!this.enableTarget.includes(this.query.target)) { this.query.target = this.enableTarget[0] }
      if (this.formats[this.query.format] == null) { this.query.format = 'csv' }
      if (this.charCodes[this.query.char_code] == null) { this.query.char_code = 'sjis' }
      if (this.newlineCodes[this.query.newline_code] == null) { this.query.newline_code = 'crlf' }

      this.$refs.observer?.reset()
    },

    setAllOutputItems () {
      this.outputItems = this.items.map(item => item.value)
      this.waiting = false
    },
    clearOutputItems () {
      this.outputItems = []
      this.waiting = false
      this.$refs.observer.setErrors({ output_items: null }) // NOTE: 初回解除時にバリデーションが効かない為
    },

    // ダウンロード依頼
    async postDownloadCreate ($dialog) {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.downloadCreateUrl, {
        download: {
          model: this.model,
          space_code: this.space?.code || null,
          ...this.query,
          output_items: this.items.filter(item => this.outputItems.includes(item.value)).map(item => item.value),
          select_items: this.selectItems,
          search_params: this.searchParams
        }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          localStorage.setItem('download.format', this.query.format)
          localStorage.setItem('download.char_code', this.query.char_code)
          localStorage.setItem('download.newline_code', this.query.newline_code)
          $dialog.value = false
          this.$router.push({ path: '/downloads', query: { id: response.data.download?.id || null } })
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { forbidden: true, notfound: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })

      this.processing = false
    }
  }
}
</script>
