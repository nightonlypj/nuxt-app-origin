<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="on">
            <v-card-title>アカウント登録</v-card-title>
            <v-card-text>
              <validation-provider v-slot="{ errors }" name="name" rules="required|max:32">
                <v-text-field
                  v-model="query.name"
                  label="氏名"
                  prepend-icon="mdi-account"
                  autocomplete="name"
                  counter="32"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="email" rules="required|email">
                <v-text-field
                  v-model="query.email"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="email"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
                <v-text-field
                  v-model="query.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード [8文字以上]"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="new-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_password:password">
                <v-text-field
                  v-model="query.password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード(確認)"
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
                id="sign_up_btn"
                color="primary"
                class="mt-4"
                :disabled="invalid || processing || waiting"
                @click="postSingUp()"
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
    </template>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email, min, max, confirmed } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
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
    Loading,
    Processing,
    Message,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: false,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      },
      showPassword: false
    }
  },

  head () {
    return {
      title: 'アカウント登録'
    }
  },

  created () {
    if (this.$auth?.loggedIn) { return this.appRedirectAlreadyAuth() }

    this.loading = false
  },

  methods: {
    // アカウント登録
    async postSingUp () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.singUpUrl, {
        ...this.query,
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

      this.processing = false
    }
  }
}
</script>
