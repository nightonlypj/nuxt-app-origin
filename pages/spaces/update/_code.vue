<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <SpacesDestroyInfo :space="space" />
      <v-card max-width="850px">
        <Processing v-if="processing" />
        <v-tabs v-model="tabPage">
          <v-tab :to="`/-/${$route.params.code}`" nuxt>スペース</v-tab>
          <v-tab href="#active">スペース設定</v-tab>
        </v-tabs>
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="on">
            <v-card-text>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  作成
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', space.created_at, 'N/A') }}</span>
                  <UsersAvatar :user="space.created_user" />
                </v-col>
              </v-row>
              <v-row v-if="space.last_updated_at != null || space.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', space.last_updated_at, 'N/A') }}</span>
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
                      placeholder="スペース名を入力"
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
                  <v-tabs v-model="tabDescription" height="32px">
                    <v-tab href="#input">入力</v-tab>
                    <v-tab href="#preview">プレビュー</v-tab>
                  </v-tabs>
                  <validation-provider v-show="tabDescription === 'input'" v-slot="{ errors }" name="description">
                    <v-textarea
                      v-model="space.description"
                      placeholder="スペースの説明を入力"
                      hint="Markdownに対応しています。"
                      :persistent-hint="true"
                      dense
                      outlined
                      hide-details="auto"
                      :error-messages="errors"
                      @input="waiting = false"
                    />
                  </validation-provider>
                  <div v-if="tabDescription === 'preview'" class="md-preview mb-2">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div class="mx-3 my-2" v-html="$md.render(space.description || '')" />
                  </div>
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
                      id="space_image_delete"
                      v-model="space.image_delete"
                      label="削除（初期画像に戻す）"
                      class="mt-4 ml-4"
                      dense
                      hide-details
                      @change="waiting = false"
                    />
                  </div>
                  <validation-provider v-slot="{ errors }" name="image" rules="size_20MB:20480">
                    <v-file-input
                      v-model="space.image"
                      accept="image/jpeg,image/gif,image/png"
                      placeholder="ファイルを選択"
                      :prepend-icon="null"
                      show-size
                      hide-details="auto"
                      :error-messages="errors"
                      @change="waiting = false"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="pr-0" />
                <v-col cols="12" md="10" class="mt-4">
                  <v-btn
                    id="space_update_btn"
                    color="primary"
                    :disabled="invalid || processing || waiting"
                    @click="postSpacesUpdate()"
                  >
                    変更
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-form>
        </validation-observer>
        <v-divider />
        <v-card-actions v-if="space.destroy_schedule_at == null">
          <ul class="my-2">
            <li><NuxtLink :to="`/spaces/delete/${$route.params.code}`">スペース削除</NuxtLink></li>
          </ul>
        </v-card-actions>
      </v-card>
    </template>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, max, size } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
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
    Loading,
    Processing,
    Message,
    SpacesDestroyInfo,
    UsersAvatar
  },
  mixins: [Application],
  middleware: 'auth',

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

  head () {
    return {
      title: 'スペース設定'
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (this.$auth.user.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }

    if (!await this.getSpacesDetail()) { return }
    if (!this.appCurrentMemberAdmin(this.space)) {
      this.appSetToastedMessage({ alert: this.$t('auth.forbidden') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }
    if (this.space.destroy_schedule_at != null) {
      this.appSetToastedMessage({ alert: this.$t('alert.space.destroy_reserved') })
      return this.$router.push({ path: `/-/${this.$route.params.code}` })
    }

    this.loading = false
  },

  methods: {
    // スペース詳細取得
    async getSpacesDetail () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaces.detailUrl.replace(':code', this.$route.params.code))
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
    async postSpacesUpdate () {
      this.processing = true

      const params = new FormData()
      params.append('space[name]', this.space.name)
      params.append('space[description]', this.space.description || '')
      if (this.$config.enablePublicSpace) { params.append('space[private]', Number(this.space.private)) }
      if (this.space.image_delete) { params.append('space[image_delete]', true) }
      if (this.space.image != null) { params.append('space[image]', this.space.image) }
      await this.$axios.post(this.$config.apiBaseURL + this.$config.spaces.updateUrl.replace(':code', this.$route.params.code), params)
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true }, response.data?.space == null)) { return }

          this.appSetToastedMessage(response.data, false)
          this.$auth.fetchUser() // NOTE: 左メニューの参加スペース更新の為
          this.$router.push({ path: `/-/${this.$route.params.code}` })
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true, reserved: true })) { return }

          this.appSetMessage(error.response.data, true)
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
