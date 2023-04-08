<template>
  <div>
    <v-btn
      id="space_create_btn"
      :color="btnColor"
      @click="showDialog()"
    >
      <v-icon dense>mdi-folder-plus</v-icon>
      <span class="ml-1"><slot name="name">スペース作成</slot></span>
    </v-btn>
    <v-dialog v-model="dialog" max-width="850px">
      <v-card id="space_create_dialog">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense>
              <v-icon dense>mdi-folder-plus</v-icon>
              <span class="ml-1">スペース作成</span>
            </v-toolbar>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                    名称&nbsp;<span class="red--text">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="name" rules="required|min:3|max:128">
                      <v-text-field
                        v-model="space.name"
                        placeholder="名称を追加"
                        dense
                        outlined
                        hide-details="auto"
                        counter="128"
                        :error-messages="errors"
                        @input="waiting = false"
                      />
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                    説明
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="description">
                      <v-textarea
                        v-model="space.description"
                        placeholder="説明を追加"
                        hint="Markdownに対応しています。"
                        :persistent-hint="true"
                        dense
                        outlined
                        hide-details="auto"
                        :error-messages="errors"
                        @input="waiting = false"
                      />
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row v-if="$config.enablePublicSpace">
                  <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0">
                    表示&nbsp;<span class="red--text">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="private" rules="required_select">
                      <v-radio-group
                        v-model="space.private"
                        class="mt-0 pt-0"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          id="private_false"
                          label="誰でも表示できる（公開）"
                          :value="false"
                          @change="waiting = false"
                        />
                        <v-radio
                          id="private_true"
                          label="メンバーのみ表示できる（非公開）"
                          :value="true"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0">
                    画像
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="image" rules="size_20MB:20480">
                      <v-file-input
                        v-model="space.image"
                        accept="image/jpeg,image/gif,image/png"
                        placeholder="ファイルを選択"
                        :prepend-icon="null"
                        show-size
                        hide-details="auto"
                        :error-messages="errors"
                        @click="waiting = false"
                      />
                    </validation-provider>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="space_create_submit_btn"
                color="primary"
                :disabled="invalid || processing || waiting"
                @click="postSpacesCreate()"
              >
                作成
              </v-btn>
              <v-btn
                id="space_create_cancel_btn"
                color="secondary"
                @click="dialog = false"
              >
                キャンセル
              </v-btn>
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, max, size } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('required_select', required)
extend('min', min)
extend('max', max)
extend('size_20MB', size)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing
  },
  mixins: [Application],

  props: {
    btnColor: {
      type: String,
      default: 'primary'
    }
  },

  data () {
    return {
      processing: false,
      waiting: false,
      dialog: false,
      space: this.initialSpace()
    }
  },

  methods: {
    // 初期値
    initialSpace () {
      return this.$config.enablePublicSpace ? { private: this.$config.defaultPrivateSpace } : {}
    },

    // ダイアログ表示
    showDialog () {
      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      this.dialog = true
    },

    // スペース作成
    async postSpacesCreate () {
      this.processing = true

      const params = new FormData()
      params.append('space[name]', this.space.name)
      params.append('space[description]', this.space.description || '')
      if (this.$config.enablePublicSpace) {
        params.append('space[private]', Number(this.space.private))
      }
      if (this.space.image != null) {
        params.append('space[image]', this.space.image)
      }
      await this.$axios.post(this.$config.apiBaseURL + this.$config.spaces.createUrl, params)
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$auth.fetchUser() // NOTE: 左メニューの参加スペース更新の為
          if (response.data.space?.code != null) {
            this.$router.push({ path: `/-/${response.data.space.code}` })
          } else {
            this.dialog = false
            this.space = this.initialSpace()
            this.$refs.observer.reset()
          }
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, reserved: true })) { return }

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
