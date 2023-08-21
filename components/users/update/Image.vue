<template>
  <div>
    <Processing v-if="processing" />
    <validation-observer v-slot="{ invalid }" ref="observer">
      <v-form autocomplete="off">
        <v-card-text>
          <v-avatar size="256px">
            <v-img :src="$auth.user.image_url.xlarge" />
          </v-avatar>
          <validation-provider v-slot="{ errors }" name="image" rules="size_20MB:20480">
            <v-file-input
              v-model="image"
              accept="image/jpeg,image/gif,image/png"
              label="画像ファイル"
              prepend-icon="mdi-camera"
              show-size
              :error-messages="errors"
              @click="waiting = false"
            />
          </validation-provider>
          <v-btn
            id="user_image_update_btn"
            color="primary"
            class="mt-2"
            :disabled="invalid || image == null || processing || waiting"
            @click="postUserImageUpdate()"
          >
            アップロード
          </v-btn>
          <v-dialog transition="dialog-top-transition" max-width="600px">
            <template #activator="{ on, attrs }">
              <v-btn
                id="user_image_delete_btn"
                color="secondary"
                class="mt-2"
                :disabled="!$auth.user.upload_image || processing"
                v-bind="attrs"
                v-on="on"
              >
                画像削除
              </v-btn>
            </template>
            <template #default="dialog">
              <v-card id="user_image_delete_dialog">
                <v-toolbar color="secondary" dense>画像削除</v-toolbar>
                <v-card-text>
                  <div class="text-h6 pa-4">本当に削除しますか？</div>
                </v-card-text>
                <v-card-actions class="justify-end">
                  <v-btn
                    id="user_image_delete_no_btn"
                    color="secondary"
                    @click="dialog.value = false"
                  >
                    いいえ（キャンセル）
                  </v-btn>
                  <v-btn
                    id="user_image_delete_yes_btn"
                    color="primary"
                    @click="postUserImageDelete(dialog)"
                  >
                    はい（削除）
                  </v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </v-card-text>
      </v-form>
    </validation-observer>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { size } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/utils/application.js'

extend('size_20MB', size)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing
  },
  mixins: [Application],

  data () {
    return {
      processing: false,
      waiting: false,
      image: null
    }
  },

  methods: {
    // ユーザー画像変更
    async postUserImageUpdate () {
      this.processing = true

      const params = new FormData()
      params.append('image', this.image)
      await this.$axios.post(this.$config.public.apiBaseURL + this.$config.public.userImageUpdateUrl, params)
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.setUser(response)
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, reserved: true })) { return }

          this.appSetEmitMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })

      this.processing = false
    },

    // ユーザー画像削除
    async postUserImageDelete ($dialog) {
      this.processing = true
      $dialog.value = false

      await this.$axios.post(this.$config.public.apiBaseURL + this.$config.public.userImageDeleteUrl)
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.setUser(response)
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, reserved: true })) { return }

          this.appSetEmitMessage(error.response.data, true)
        })

      this.processing = false
    },

    // ユーザー情報更新
    setUser (response) {
      this.$auth.setUser(response.data.user)
      this.appSetToastedMessage(response.data, false)
      this.image = null

      this.appSetEmitMessage(null) // NOTE: Data.vueのalertを消す為
    }
  }
}
</script>
