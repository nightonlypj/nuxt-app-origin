<template>
  <v-btn
    id="space_create_btn"
    :color="btnColor"
    @click="showDialog()"
  >
    <v-icon>mdi-folder-plus</v-icon>
    <span class="ml-1"><slot name="name">スペース作成</slot></span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="850px" :attach="$config.public.env.test">
    <v-card id="space_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-folder-plus</v-icon>
            <span class="ml-1">スペース作成</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  名称<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.name" name="name" rules="required|min:3|max:128">
                    <v-text-field
                      id="space_create_name_text"
                      v-model="space.name"
                      placeholder="スペース名を入力"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      counter="128"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  説明<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <v-tabs v-model="tabDescription" color="primary" height="32px">
                    <v-tab value="input">入力</v-tab>
                    <v-tab value="preview">プレビュー</v-tab>
                  </v-tabs>
                  <span v-show="tabDescription === 'input'">
                    <Field v-slot="{ errors }" v-model="space.description" name="description">
                      <v-textarea
                        id="space_create_description_text"
                        v-model="space.description"
                        placeholder="スペースの説明を入力"
                        hint="Markdownに対応しています。"
                        :persistent-hint="true"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      />
                    </Field>
                  </span>
                  <div v-if="tabDescription === 'preview'" class="md-preview mb-2">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div class="mx-3 my-2" v-html="(space.description || '')" />
                    <!-- TODO: div class="mx-3 my-2" v-html="$md.render(space.description || '')" / -->
                  </div>
                </v-col>
              </v-row>
              <v-row v-if="$config.public.enablePublicSpace">
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0 mt-1">
                  表示<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.private" name="private" :rules="{ one_of_select: [false, true] }">
                    <v-radio-group
                      v-model="space.private"
                      color="primary"
                      class="mt-0 pt-0"
                      density="compact"
                      inline
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    >
                      <v-radio
                        id="space_create_private_false"
                        label="誰でも表示できる（公開）"
                        :value="false"
                        class="mr-2"
                      />
                      <v-radio
                        id="space_create_private_true"
                        label="メンバーのみ表示できる（非公開）"
                        :value="true"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0 mt-3">
                  画像<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.image" name="image" rules="size_20MB:20480">
                    <v-file-input
                      id="space_create_image_file"
                      v-model="space.image"
                      accept="image/jpeg,image/gif,image/png"
                      label="画像ファイル"
                      :prepend-icon="null"
                      show-size
                      class="mt-2"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="space_create_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postSpacesCreate(setErrors, values)"
            >
              作成
            </v-btn>
            <v-btn
              id="space_create_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="dialog = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </v-dialog>
</template>

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
// eslint-disable-next-line camelcase
import { required, one_of, min, max, size } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('one_of_select', one_of)
defineRule('min', min)
defineRule('max', max)
defineRule('size_20MB', size)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppProcessing,
    AppRequiredLabel
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
      tabDescription: 'input',
      space: this.initialSpace()
    }
  },

  methods: {
    // 初期値
    initialSpace () {
      return this.$config.public.enablePublicSpace ? { private: this.$config.public.defaultPrivateSpace } : {}
    },

    // ダイアログ表示
    showDialog () {
      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      this.dialog = true
    },

    // スペース作成
    async postSpacesCreate (setErrors, values) {
      this.processing = true

      const params = {
        'space[name]': this.space.name,
        'space[description]': this.space.description || ''
      }
      if (this.$config.public.enablePublicSpace) { params['space[private]'] = Number(this.space.private) }
      if (this.space.image != null && this.space.image.length > 0) { params['space[image]'] = this.space.image[0] }

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.spaces.createUrl, 'POST', params, 'form')

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
          if (data.space?.code != null) {
            navigateTo(`/-/${data.space.code}`)
          } else {
            this.dialog = false
            this.space = this.initialSpace()
          }
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, reserved: true })) {
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
