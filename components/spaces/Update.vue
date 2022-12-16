<template>
  <v-dialog v-model="dialog" max-width="850px">
    <v-card id="space_update_dialog">
      <validation-observer v-slot="{ invalid }" ref="observer">
        <Processing v-if="processing" />
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense dark>
            <v-icon dense>mdi-cog</v-icon>
            <span class="ml-1">スペース設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  作成
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3">{{ $timeFormat(space.created_at, 'ja', 'N/A') }}</span>
                  <UsersAvatar :user="space.created_user" />
                </v-col>
              </v-row>
              <v-row v-if="space.last_updated_at || space.last_updated_user">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  最終更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3">{{ $timeFormat(space.last_updated_at, 'ja') }}</span>
                  <UsersAvatar :user="space.last_updated_user" />
                </v-col>
              </v-row>
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
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
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
                        label="誰でも表示できる（公開）"
                        :value="false"
                        @change="waiting = false"
                      />
                      <v-radio
                        label="メンバーのみ表示できる（非公開）"
                        :value="true"
                        @change="waiting = false"
                      />
                    </v-radio-group>
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 pt-8">
                  画像
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <div class="d-flex align-self-center">
                    <v-avatar v-if="space.image_url != null" size="64px">
                      <v-img :src="space.image_url.medium" />
                    </v-avatar>
                    <v-checkbox
                      v-if="space.upload_image"
                      v-model="space.image_delete"
                      label="削除（初期画像に戻す）"
                      class="mt-4 ml-4"
                      dense
                      hide-details
                      @click="waiting = false"
                    />
                  </div>
                  <validation-provider v-slot="{ errors }" name="image" rules="size_20MB:20480">
                    <v-file-input
                      v-model="space.image"
                      accept="image/jpeg,image/gif,image/png"
                      placeholder="ファイルを選択"
                      :prepend-icon="null"
                      show-size
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
              id="space_update_submit_btn"
              color="primary"
              :disabled="invalid || processing || waiting"
              @click="postSpaceUpdate()"
            >
              変更
            </v-btn>
            <v-btn
              id="space_update_cancel_btn"
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
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, max, size } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
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
    Processing,
    UsersAvatar
  },
  mixins: [Application],

  data () {
    return {
      processing: false,
      waiting: false,
      dialog: false,
      space: null
    }
  },

  methods: {
    // ダイアログ表示
    async showDialog (space) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('showDialog', space) }

      if (!this.$auth.loggedIn) {
        return this.appRedirectAuth()
      } else if (this.$auth.user.destroy_schedule_at != null) {
        return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') })
      }

      if (!await this.getSpace(space)) { return }

      this.waiting = true
      this.dialog = true
    },

    // スペース詳細取得
    async getSpace (space) {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaceDetailUrl.replace(':code', space.code))
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

    // スペース設定変更
    async postSpaceUpdate () {
      this.processing = true

      const params = new FormData()
      params.append('space[name]', this.space.name)
      params.append('space[description]', this.space.description || '')
      if (this.$config.enablePublicSpace) {
        params.append('space[private]', Number(this.space.private))
      }
      params.append('space[image_delete]', Number(this.space.image_delete || false))
      if (this.space.image != null) {
        params.append('space[image]', this.space.image)
      }
      await this.$axios.post(this.$config.apiBaseURL + this.$config.spaceUpdateUrl.replace(':code', this.space.code), params)
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true }, response.data.space == null)) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('space', response.data.space)
          this.$auth.fetchUser() // NOTE: 左メニューの参加スペース更新の為
          this.dialog = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true, reserved: true })) { return }

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
