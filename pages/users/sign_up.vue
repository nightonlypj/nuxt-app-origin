<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <Processing v-if="processing" />
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="on">
          <v-card-title>アカウント登録</v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="name" rules="required">
              <v-text-field
                v-model="name"
                label="氏名"
                prepend-icon="mdi-account"
                autocomplete="name"
                :error-messages="errors"
                @input="waiting = false"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="email"
                :error-messages="errors"
                @input="waiting = false"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
              <v-text-field
                v-model="password"
                type="password"
                label="パスワード [8文字以上]"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
                @input="waiting = false"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_password:password">
              <v-text-field
                v-model="password_confirmation"
                type="password"
                label="パスワード(確認)"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
                @input="waiting = false"
              />
            </validation-provider>
            <v-btn
              id="sign_up_btn"
              color="primary"
              :disabled="invalid || processing || waiting"
              @click="onSignUp()"
            >
              登録
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="sign_up" />
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email, min, confirmed } from 'vee-validate/dist/rules'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
extend('min', min)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  },

  head () {
    return {
      title: 'アカウント登録'
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      return this.appRedirectAlreadyAuth()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウント登録
    async onSignUp () {
      this.processing = true
      await this.postSingUp()
      this.processing = false
    },

    // アカウント登録API
    async postSingUp () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.singUpUrl, {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        confirm_success_url: this.$config.frontBaseURL + this.$config.singUpSuccessUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appRedirectSignIn(response.data)
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true })) { return }

          this.appSetMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })
    }
  }
}
</script>
