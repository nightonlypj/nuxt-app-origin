<template>
  <Head>
    <Title>スペース設定</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage :alert="alert" :notice="notice" />
    <SpacesDestroyInfo :space="space" />
    <v-card max-width="850px">
      <AppProcessing v-if="processing" />
      <v-tabs v-model="tabPage" color="primary">
        <v-tab :to="`/-/${$route.params.code}`">スペース</v-tab>
        <v-tab value="active">スペース設定</v-tab>
      </v-tabs>
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="on">
          <v-card-text>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                作成
              </v-col>
              <v-col cols="12" md="10" class="d-flex pb-0">
                <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', space.created_at, 'N/A') }}</span>
                <UsersAvatar :user="space.created_user" />
              </v-col>
            </v-row>
            <v-row v-if="space.last_updated_at != null || space.last_updated_user != null">
              <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                更新
              </v-col>
              <v-col cols="12" md="10" class="d-flex pb-0">
                <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', space.last_updated_at, 'N/A') }}</span>
                <UsersAvatar :user="space.last_updated_user" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                名称<AppRequiredLabel />
              </v-col>
              <v-col cols="12" md="10" class="pb-0">
                <Field v-slot="{ errors }" v-model="space.name" name="name" rules="required|min:3|max:128">
                  <v-text-field
                    id="space_update_name_text"
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
                      id="space_update_description_text"
                      v-model="space.description"
                      placeholder="スペースの説明を入力"
                      hint="Markdownに対応しています。"
                      :persistent-hint="true"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :disabled="tabDescription !== 'input'"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </span>
                <div v-show="tabDescription === 'preview'" class="md-preview mb-2">
                  <AppMarkdown :source="space.description" class="mx-3 my-2" />
                </div>
              </v-col>
            </v-row>
            <v-row v-if="$config.public.enablePublicSpace">
              <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-1">
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
                      id="space_update_private_false"
                      label="誰でも表示できる（公開）"
                      :value="false"
                      class="mr-2"
                    />
                    <v-radio
                      id="space_update_private_true"
                      label="メンバーのみ表示できる（非公開）"
                      :value="true"
                    />
                  </v-radio-group>
                </Field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 pt-8">
                画像<AppRequiredLabel optional />
              </v-col>
              <v-col cols="12" md="10" class="pb-0">
                <div class="d-flex align-self-center">
                  <v-avatar v-if="space.image_url != null" size="64px">
                    <v-img :src="space.image_url.medium" />
                  </v-avatar>
                  <v-checkbox
                    v-if="space.upload_image"
                    id="space_update_image_delete_check"
                    v-model="space.image_delete"
                    color="primary"
                    label="削除（初期画像に戻す）"
                    class="mt-4 ml-4"
                    density="compact"
                    hide-details
                    @update:model-value="waiting = false"
                  />
                </div>
                <Field v-slot="{ errors }" v-model="space.image" name="image" rules="size_20MB:20480">
                  <v-file-input
                    id="space_update_image_file"
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
            <v-row>
              <v-col cols="auto" md="2" class="pr-0" />
              <v-col cols="12" md="10" class="mt-4">
                <v-btn
                  id="space_update_btn"
                  color="primary"
                  :disabled="!meta.valid || processing || waiting"
                  @click="postSpacesUpdate(setErrors, values)"
                >
                  変更
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-form>
      </Form>
      <v-divider />
      <v-card-actions v-if="space.destroy_schedule_at == null">
        <ul class="my-2">
          <li><NuxtLink :to="`/spaces/delete/${$route.params.code}`">スペース削除</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </template>
</template>

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
// eslint-disable-next-line camelcase
import { required, one_of, min, max, size } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
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
    AppLoading,
    AppProcessing,
    AppMessage,
    AppRequiredLabel,
    AppMarkdown,
    SpacesDestroyInfo,
    UsersAvatar
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: false,
      waiting: true,
      alert: null,
      notice: null,
      tabPage: 'active',
      tabDescription: 'input',
      space: null
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
    if (this.$auth.user.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') })
      return this.navigateToSpace()
    }

    if (!await this.getSpacesDetail()) { return }
    if (!this.appCurrentMemberAdmin(this.space)) {
      this.appSetToastedMessage({ alert: this.$t('auth.forbidden') })
      return this.navigateToSpace()
    }
    if (this.space.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('alert.space.destroy_reserved') })
      return this.navigateToSpace()
    }

    this.loading = false
  },

  methods: {
    navigateToSpace () {
      navigateTo(`/-/${this.$route.params.code}`)
    },

    // スペース詳細取得
    async getSpacesDetail () {
      const url = this.$config.public.spaces.detailUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { redirect: true }, data?.space == null)) {
          this.space = data.space
          return true
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }

      return false
    },

    // スペース設定変更
    async postSpacesUpdate (setErrors, values) {
      this.processing = true

      const params = {
        'space[name]': this.space.name,
        'space[description]': this.space.description || ''
      }
      if (this.$config.public.enablePublicSpace) { params['space[private]'] = Number(this.space.private) }
      if (this.space.image_delete) { params['space[image_delete]'] = true }
      if (this.space.image != null && this.space.image.length > 0) { params['space[image]'] = this.space.image[0] }

      const url = this.$config.public.spaces.updateUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', params, 'form')

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true }, data?.space == null)) {
          this.appSetToastedMessage(data, false, true)
          await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
          this.navigateToSpace()
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, forbidden: true, reserved: true })) {
        this.appSetMessage(data, true)
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
