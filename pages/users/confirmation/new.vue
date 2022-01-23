<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <Processing v-if="processing" />
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-card-title>メールアドレス確認</v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
                @click="waiting = false"
              />
            </validation-provider>
            <v-btn id="confirmation_new_btn" color="primary" :disabled="invalid || processing || waiting" @click="onConfirmationNew()">送信</v-btn>
          </v-card-text>
          <v-divider v-if="!$auth.loggedIn" />
          <v-card-actions v-if="!$auth.loggedIn">
            <ActionLink action="confirmation" />
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email } from 'vee-validate/dist/rules'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersConfirmationNew',
  components: {
    ValidationObserver,
    ValidationProvider,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      email: ''
    }
  },

  created () {
    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    async onConfirmationNew () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.confirmationNewUrl, {
        email: this.email,
        redirect_url: this.$config.frontBaseURL + this.$config.confirmationSuccessUrl
      })
        .then((response) => {
          if (response.data == null) {
            this.$toasted.error(this.$t('system.error'))
          } else if (this.$auth.loggedIn) {
            return this.appRedirectSuccess(response.data.alert, response.data.notice)
          } else {
            return this.appRedirectSignIn(response.data.alert, response.data.notice)
          }
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) {
              this.$refs.observer.setErrors(error.response.data.errors)
              this.waiting = true
            }
          }
        })

      this.processing = false
    }
  }
}
</script>
