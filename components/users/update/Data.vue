<template>
  <div>
    <Processing v-if="processing" />
    <validation-observer v-slot="{ invalid }" ref="observer">
      <v-form autocomplete="off">
        <v-card-text>
          <validation-provider v-slot="{ errors }" name="name" rules="required|max:32">
            <v-text-field
              v-model="query.name"
              label="氏名"
              prepend-icon="mdi-account"
              autocomplete="off"
              counter="32"
              :error-messages="errors"
              @input="waiting = false"
            />
          </validation-provider>
          <v-alert v-if="user.unconfirmed_email != null" color="info">
            確認待ち: {{ user.unconfirmed_email }}<br>
            <small>※メールを確認してください。メールが届いていない場合は[メールアドレス確認]をしてください。</small>
          </v-alert>
          <validation-provider v-slot="{ errors }" name="email" rules="required|email">
            <v-text-field
              v-model="query.email"
              label="メールアドレス"
              prepend-icon="mdi-email"
              autocomplete="off"
              :error-messages="errors"
              @input="waiting = false"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password" rules="min:8">
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
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password_confirmation" rules="confirmed_password:password">
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
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="current_password" rules="required">
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
          </validation-provider>
          <v-btn
            id="user_update_btn"
            color="primary"
            class="mt-4"
            :disabled="invalid || processing || waiting"
            @click="postUserUpdate()"
          >
            変更
          </v-btn>
        </v-card-text>
      </v-form>
    </validation-observer>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email, min, max, confirmed } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/utils/application.js'

extend('required', required)
extend('email', email)
extend('min', min)
extend('max', max)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing
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
    async postUserUpdate () {
      this.processing = true

      await this.$axios.post(this.$config.public.apiBaseURL + this.$config.public.userUpdateUrl, {
        ...this.query,
        confirm_redirect_url: this.$config.public.frontBaseURL + this.$config.public.confirmationSuccessUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.$auth.setUser(response.data.user)
          if (this.$auth?.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
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
    }
  }
}
</script>
