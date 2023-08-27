<template>
  <div>
    <Processing v-if="processing" />
    <Form v-slot="{ meta, setErrors, values }">
      <v-form autocomplete="off">
        <v-card-text>
          <v-avatar size="256px">
            <v-img :src="$auth.user.image_url.xlarge" />
          </v-avatar>
          <Field v-slot="{ field, errors }" v-model="image" name="image" rules="size_20MB:20480">
            <v-file-input
              v-bind="field"
              accept="image/jpeg,image/gif,image/png"
              label="画像ファイル"
              prepend-icon="mdi-camera"
              show-size
              :error-messages="errors"
              @click="waiting = false"
            />
          </Field>
          <v-btn
            id="user_image_update_btn"
            color="primary"
            class="mt-2"
            :disabled="!meta.valid || image == null || processing || waiting"
            @click="postUserImageUpdate(setErrors, values)"
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
    </Form>
  </div>
</template>

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import ja from '~/locales/validate.ja'
import { size } from '@vee-validate/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/utils/application.js'

defineRule('size_20MB', size)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default {
  components: {
    Form,
    Field,
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
    async postUserImageUpdate (setErrors, values) {
      this.processing = true

      const params = new FormData()
      params.append('image', this.image)
      const [response, data] = await this.appApiRequest(this.$config.public.apiBaseURL + this.$config.public.userImageUpdateUrl, 'POST', params)

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.setUser(data)
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, reserved: true })) { return }

        this.appSetEmitMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvaildがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    },

    // ユーザー画像削除
    async postUserImageDelete ($dialog) {
      this.processing = true
      $dialog.value = false

      const [response, data] = await this.appApiRequest(this.$config.public.apiBaseURL + this.$config.public.userImageDeleteUrl, 'POST')

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.setUser(data)
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, reserved: true })) { return }

        this.appSetEmitMessage(data, true)
      }

      this.processing = false
    },

    // ユーザー情報更新
    setUser (data) {
      this.$auth.setUser(data.user)
      this.appSetToastedMessage(data, false)
      this.image = null

      this.appSetEmitMessage(null) // NOTE: Data.vueのalertを消す為
    }
  }
}
</script>
