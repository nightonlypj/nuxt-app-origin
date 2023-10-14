<template>
  <v-dialog max-width="720px" :attach="$config.public.env.test">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        id="list_download_btn"
        color="secondary"
        @click="initialize()"
      >
        <v-icon>mdi-download</v-icon>
        <span class="hidden-sm-and-down ml-1">ダウンロード</span>
        <v-tooltip activator="parent" location="bottom" :disabled="$vuetify.display.mdAndUp">ダウンロード</v-tooltip>
      </v-btn>
    </template>
    <template #default="{ isActive }">
      <v-card id="list_download_dialog">
        <AppProcessing v-if="processing" />
        <Form v-slot="{ meta, setErrors, values }">
          <v-form autocomplete="off">
            <v-toolbar color="primary" density="compact">
              <v-icon size="small" class="ml-4">mdi-download</v-icon>
              <span class="ml-1">ダウンロード</span>
            </v-toolbar>
            <v-card-text>
              <v-container class="pt-0">
                <v-row>
                  <!-- 左側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>対象</h4>
                    <Field v-slot="{ errors }" v-model="query.target" name="target" rules="required_select">
                      <v-radio-group
                        v-model="query.target"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(label, key) in targets"
                          :id="`list_download_target_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          class="mr-2"
                          :disabled="!enableTarget.includes(key)"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">形式</h4>
                    <Field v-slot="{ errors }" v-model="query.format" name="format" rules="required_select">
                      <v-radio-group
                        v-model="query.format"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(label, key) in formats"
                          :id="`list_download_format_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">文字コード</h4>
                    <Field v-slot="{ errors }" v-model="query.char_code" name="char_code" rules="required_select">
                      <v-radio-group
                        v-model="query.char_code"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(label, key) in charCodes"
                          :id="`list_download_char_code_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">改行コード</h4>
                    <Field v-slot="{ errors }" v-model="query.newline_code" name="newline_code" rules="required_select">
                      <v-radio-group
                        v-model="query.newline_code"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(label, key) in newlineCodes"
                          :id="`list_download_newline_code_${key}`"
                          :key="key"
                          :label="label"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                  </v-col>
                  <!-- 右側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>
                      出力項目
                      <v-btn
                        id="list_download_output_items_set_all_btn"
                        color="secondary"
                        size="small"
                        class="ml-4"
                        :disabled="outputItems.length >= items.length"
                        @click="setAllOutputItems()"
                      >
                        全選択
                      </v-btn>
                      <v-btn
                        id="list_download_output_items_clear_btn"
                        color="secondary"
                        size="small"
                        class="ml-1"
                        :disabled="outputItems.length === 0"
                        @click="clearOutputItems(setErrors)"
                      >
                        全解除
                      </v-btn>
                    </h4>
                    <Field v-slot="{ errors }" v-model="outputItems" name="output_items" rules="required_select">
                      <template v-for="(item, index) in items" :key="item.key">
                        <v-switch
                          :id="`list_download_output_item_${item.key.replace('.', '_')}`"
                          v-model="outputItems"
                          color="primary"
                          :label="item.title"
                          :value="item.key"
                          density="compact"
                          :hide-details="index + 1 < items.length ? 'true' : 'auto'"
                          :error-messages="errors"
                          @update:model-value="waiting = false"
                        />
                      </template>
                    </Field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="list_download_submit_btn"
                color="primary"
                variant="elevated"
                :disabled="!meta.valid || processing || waiting"
                @click="postDownloadsCreate(isActive, setErrors, values)"
              >
                ダウンロード
              </v-btn>
              <v-btn
                id="list_download_cancel_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                キャンセル
              </v-btn>
            </v-card-actions>
          </v-form>
        </Form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

defineRule('required_select', required)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppProcessing
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
      return this.$tm(`items.${this.model}`).filter(item => !item.adminOnly || this.admin)
    },
    targets () {
      return this.$tm('enums.download.target')
    },
    formats () {
      return this.$tm('enums.download.format')
    },
    charCodes () {
      return this.$tm('enums.download.char_code')
    },
    newlineCodes () {
      return this.$tm('enums.download.newline_code')
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
      this.outputItems = this.items.filter(item => !this.hiddenItems.includes(item.key)).map(item => item.key)

      this.enableTarget = []
      if (this.selectItems != null && this.selectItems.length > 0) { this.enableTarget.push('select') }
      if (this.searchParams != null && Object.keys(this.searchParams).length > 0) { this.enableTarget.push('search') }
      this.enableTarget.push('all')

      if (!this.enableTarget.includes(this.query.target)) { this.query.target = this.enableTarget[0] }
      if (this.formats[this.query.format] == null) { this.query.format = 'csv' }
      if (this.charCodes[this.query.char_code] == null) { this.query.char_code = 'sjis' }
      if (this.newlineCodes[this.query.newline_code] == null) { this.query.newline_code = 'crlf' }
    },

    setAllOutputItems () {
      this.outputItems = this.items.map(item => item.key)
      this.waiting = false
    },
    clearOutputItems (setErrors) {
      this.outputItems = []
      this.waiting = false
      setErrors({ output_items: null }) // NOTE: 初回解除時にバリデーションが効かない為
    },

    // ダウンロード依頼
    async postDownloadsCreate (isActive, setErrors, values) {
      this.processing = true

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.downloads.createUrl, 'POST', {
        download: {
          model: this.model,
          space_code: this.space?.code || null,
          ...this.query,
          output_items: this.items.filter(item => this.outputItems.includes(item.key)).map(item => item.key),
          select_items: this.selectItems,
          search_params: this.searchParams
        }
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          localStorage.setItem('download.format', this.query.format)
          localStorage.setItem('download.char_code', this.query.char_code)
          localStorage.setItem('download.newline_code', this.query.newline_code)
          isActive.value = false
          navigateTo({ path: '/downloads', query: { target_id: data.download?.id || null } })
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, forbidden: true, notfound: true })) {
        this.appSetToastedMessage(data, true)
        if (data.errors != null) {
          setErrors(pickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvalidがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
