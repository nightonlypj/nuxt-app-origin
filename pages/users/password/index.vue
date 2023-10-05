<template>
  <Head>
    <Title>パスワード再設定</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:alert="alert" v-model:notice="notice" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-card-title>パスワード再設定</v-card-title>
          <v-card-text
            id="input_area"
            @keydown.enter="appSetKeyDownEnter"
            @keyup.enter="postPasswordUpdate(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required|min:8">
              <v-text-field
                id="input_password"
                v-model="query.password"
                :type="showPassword ? 'text' : 'password'"
                label="新しいパスワード [8文字以上]"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="required|confirmed_new_password:@password">
              <v-text-field
                id="input_password_confirmation"
                v-model="query.password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                label="新しいパスワード(確認)"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <v-btn
              id="password_update_btn"
              color="primary"
              class="mt-4"
              :disabled="!meta.valid || processing || waiting"
              @click="postPasswordUpdate(!meta.valid, false, setErrors, values)"
            >
              変更
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="password" />
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </template>
</template>

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, min, confirmed } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('min', min)
defineRule('confirmed_new_password', confirmed)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppLoading,
    AppProcessing,
    AppMessage,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        password: '',
        password_confirmation: ''
      },
      showPassword: false,
      keyDownEnter: false
    }
  },

  created () {
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }
    if (this.$route.query.reset_password === 'false') {
      return navigateTo({ path: '/users/password/reset', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    if (!this.$route.query.reset_password_token) {
      return navigateTo({ path: '/users/password/reset', query: { alert: this.$t('auth.reset_password_token_blank') } })
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // パスワード再設定
    async postPasswordUpdate (invalid, keydown, setErrors, values) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.passwordUpdateUrl, 'POST', {
        reset_password_token: this.$route.query.reset_password_token,
        ...this.query
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.$auth.setData(data)
          return this.appRedirectTop(data, true)
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true })) {
        if (data.errors == null) {
          return navigateTo({ path: '/users/password/reset', query: { alert: this.appGetAlertMessage(data, true), notice: data.notice } })
        }

        this.appSetMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvalidがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
