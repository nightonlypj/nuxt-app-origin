<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }">
          <v-form autocomplete="on">
            <v-card-title>ログイン</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="signIn(invalid, true)"
            >
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
              <validation-provider v-slot="{ errors }" name="password" rules="required">
                <v-text-field
                  v-model="query.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="current-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </validation-provider>
              <v-btn
                id="sign_in_btn"
                color="primary"
                class="mt-4"
                :disabled="invalid || processing || waiting"
                @click="signIn(invalid, false)"
              >
                ログイン
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="sign_in" />
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </template>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
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
      processing: true,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        email: '',
        password: ''
      },
      showPassword: false,
      keyDownEnter: false
    }
  },

  head () {
    return {
      title: 'ログイン'
    }
  },

  created () {
    switch (this.$route.query.account_confirmation_success) {
      case 'true':
        if (this.$auth.loggedIn) { return this.appRedirectTop(this.$route.query) }
        break
      case 'false':
        return this.$router.push({ path: '/users/confirmation/resend', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    switch (this.$route.query.unlock) {
      case 'true':
      case 'false':
        if (this.$auth.loggedIn) { return this.appRedirectTop(this.$route.query) }
    }
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }

    if (this.$route.query.account_confirmation_success === 'true' || this.$route.query.unlock === 'true') {
      this.$route.query.notice = (this.$route.query.notice != null ? this.$route.query.notice : '') + this.$t('auth.unauthenticated')
    }
    this.appSetQueryMessage()

    this.processing = false
    this.loading = false
  },

  methods: {
    // ログイン
    async signIn (invalid, keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      await this.$auth.loginWith('local', {
        data: {
          ...this.query,
          unlock_redirect_url: this.$config.frontBaseURL + this.$config.unlockRedirectUrl
        }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true })) { return }

          this.appSetMessage(error.response.data, true)
          this.waiting = true
        })

      this.processing = false
    }
  }
}
</script>
