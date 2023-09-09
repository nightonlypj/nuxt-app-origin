<template>
  <AppProcessing v-if="processing" />
  <Form v-slot="{ meta, setErrors, values }">
    <v-form autocomplete="off">
      <v-card-text>
        <Field v-slot="{ errors }" v-model="query.name" name="name" rules="required|max:32">
          <v-text-field
            v-model="query.name"
            label="氏名"
            prepend-icon="mdi-account"
            autocomplete="off"
            counter="32"
            :error-messages="errors"
            @input="waiting = false"
          />
        </Field>
        <v-alert v-if="user.unconfirmed_email != null" color="info">
          確認待ち: {{ user.unconfirmed_email }}<br>
          <small>※メールを確認してください。メールが届いていない場合は[メールアドレス確認]をしてください。</small>
        </v-alert>
        <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
          <v-text-field
            v-model="query.email"
            label="メールアドレス"
            prepend-icon="mdi-email"
            autocomplete="off"
            :error-messages="errors"
            @input="waiting = false"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.password" name="password" rules="min:8">
          <v-text-field
            v-model="query.password"
            :type="showPassword ? 'text' : 'password'"
            label="パスワード [8文字以上] (変更する場合のみ)"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            counter
            :error-messages="errors"
            @input="waiting = false"
            @click:append="showPassword = !showPassword"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="confirmed_password:@password">
          <v-text-field
            v-model="query.password_confirmation"
            :type="showPassword ? 'text' : 'password'"
            label="パスワード(確認) (変更する場合のみ)"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            counter
            :error-messages="errors"
            @input="waiting = false"
            @click:append="showPassword = !showPassword"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.current_password" name="current_password" rules="required">
          <v-text-field
            v-model="query.current_password"
            :type="showPassword ? 'text' : 'password'"
            label="現在のパスワード"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            counter
            :error-messages="errors"
            @input="waiting = false"
            @click:append="showPassword = !showPassword"
          />
        </Field>
        <v-btn
          id="user_update_btn"
          color="primary"
          class="mt-4"
          :disabled="!meta.valid || processing || waiting"
          @click="postUserUpdate(setErrors, values)"
        >
          変更
        </v-btn>
      </v-card-text>
    </v-form>
  </Form>
</template>

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed_password', confirmed)
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
    user: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      processing: false,
      waiting: false,
      query: {
        name: this.user.name,
        email: this.user.email,
        password: '',
        password_confirmation: '',
        current_password: ''
      },
      showPassword: false
    }
  },

  methods: {
    // ユーザー情報変更
    async postUserUpdate (setErrors, values) {
      this.processing = true

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.userUpdateUrl, 'POST', {
        ...this.query,
        confirm_redirect_url: this.$config.public.frontBaseURL + this.$config.public.confirmationSuccessUrl
      })

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.$auth.setData(data)
        this.appRedirectTop(data)
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, reserved: true })) { return }

        this.appSetEmitMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvaildがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
