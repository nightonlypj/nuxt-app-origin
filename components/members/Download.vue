<template>
  <v-dialog max-width="640px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="member_download_btn"
        color="accent"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-icon dense>mdi-download</v-icon>
        <span class="hidden-sm-and-down ml-1">ダウンロード</span>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="member_download_dialog">
        <validation-observer v-slot="{ invalid }" ref="observer">
          <Processing v-if="processing" />
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense dark>
              <v-icon dense>mdi-download</v-icon>
              <span class="ml-1">ダウンロード</span>
            </v-toolbar>
            <v-card-text>
              <Message :alert="alert" :notice="notice" />
              <v-container class="pt-0">
                <v-row>
                  <!-- 左側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>対象</h4>
                    <validation-provider v-slot="{ errors }" name="target" rules="required_select">
                      <v-radio-group
                        v-model="target"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          label="検索"
                          value="search"
                          :disabled="members == null || members.length === 0"
                        />
                        <v-radio
                          label="選択"
                          value="select"
                          :disabled="selectedMembers.length === 0"
                        />
                        <v-radio
                          label="すべて"
                          value="all"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">形式</h4>
                    <validation-provider v-slot="{ errors }" name="format" rules="required_select">
                      <v-radio-group
                        v-model="format"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          label="CSV"
                          value="csv"
                        />
                        <v-radio
                          label="TSV"
                          value="tsv"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">文字コード</h4>
                    <validation-provider v-slot="{ errors }" name="char" rules="required_select">
                      <v-radio-group
                        v-model="char"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          label="ShiftJIS"
                          value="sjis"
                        />
                        <v-radio
                          label="UTF-8"
                          value="utf8"
                        />
                      </v-radio-group>
                    </validation-provider>
                    <h4 class="pt-3">改行コード</h4>
                    <validation-provider v-slot="{ errors }" name="newline" rules="required_select">
                      <v-radio-group
                        v-model="newline"
                        class="mt-1"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          label="CR+LF"
                          value="cr+lf"
                        />
                        <v-radio
                          label="LF"
                          value="lf"
                        />
                        <v-radio
                          label="CR"
                          value="cr"
                        />
                      </v-radio-group>
                    </validation-provider>
                  </v-col>
                  <!-- 右側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>出力項目</h4>
                    <template v-for="item in items">
                      <v-switch
                        v-if="!item.adminOnly || currentMemberAdmin"
                        :id="'output_item_' + item.value.replace('.', '_')"
                        :key="item.value"
                        v-model="outputItems"
                        color="primary"
                        :label="item.text"
                        :value="item.value"
                        hide-details
                        dense
                        class="mt-1"
                      />
                    </template>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="member_download_submit_btn"
                color="primary"
                :disabled="processing || invalid || outputItems.length === 0"
                @click="postMembersDownload(dialog)"
              >
                ダウンロード
              </v-btn>
              <v-btn
                id="member_download_cancel_btn"
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
import Message from '~/components/Message.vue'
import Application from '~/plugins/application.js'

extend('required_select', required)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing,
    Message
  },
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    },
    params: {
      type: Object,
      default: null
    },
    members: {
      type: Array,
      default: null
    },
    selectedMembers: {
      type: Array,
      required: true
    },
    showItems: {
      type: Array,
      default: null
    },
    currentMemberAdmin: {
      type: Boolean,
      default: null
    }
  },

  data () {
    return {
      processing: false,
      alert: null,
      notice: null,
      target: null,
      format: null,
      char: null,
      newline: null,
      outputItems: null
    }
  },

  computed: {
    items () {
      return this.$t('items.members')
    }
  },

  methods: {
    initialize () {
      this.target = localStorage.getItem('download.target') || 'search'
      this.format = localStorage.getItem('download.format') || 'csv'
      this.char = localStorage.getItem('download.char') || 'sjis'
      this.newline = localStorage.getItem('download.newline') || 'cr+lf'
      this.outputItems = this.appGetShowItems(this.showItems, this.items)

      // 選択可能な対象に変更
      const enableTargets = []
      if (this.members != null && this.members.length > 0) {
        enableTargets.push('search')
      }
      if (this.selectedMembers.length > 0) {
        enableTargets.push('select')
      }
      enableTargets.push('all')

      if (!enableTargets.includes(this.target)) {
        this.target = enableTargets[0]
      }
    },

    // メンバーCSVダウンロード
    async postMembersDownload ($dialog) {
      this.processing = true

      const items = []
      for (const item of this.items) {
        if ((!item.adminOnly || this.currentMemberAdmin) && this.outputItems.includes(item.value)) {
          items.push(item.value)
        }
      }
      const params = {
        target: this.target,
        format: this.format,
        char: this.char,
        newline: this.newline,
        items
      }

      if (this.target === 'search') {
        params.params = this.params
      }
      if (this.target === 'select') {
        const codes = []
        for (const member of this.selectedMembers) {
          codes.push(member.user.code)
        }
        params.codes = codes
      }

      await this.$axios.post(this.$config.apiBaseURL + this.$config.membersDownloadUrl.replace(':code', this.space.code), { ...params })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          localStorage.setItem('download.target', this.target)
          localStorage.setItem('download.format', this.format)
          localStorage.setItem('download.char', this.char)
          localStorage.setItem('download.newline', this.newline)
          $dialog.value = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
        })

      this.processing = false
    }
  }
}
</script>
