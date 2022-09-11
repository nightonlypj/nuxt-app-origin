<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <Processing v-if="processing" />
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off" @submit.prevent>
          <v-card-title>メールアドレス確認</v-card-title>
          <v-card-text
            @keydown.enter="onKeyDown"
            @keyup.enter="onConfirmationNew(invalid, true)"
          >
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
                @input="waiting = false"
              />
            </validation-provider>
            <v-btn
              id="confirmation_new_btn"
              color="primary"
              :disabled="invalid || processing || waiting"
              @click="onConfirmationNew(invalid)"
            >
              送信
            </v-btn>
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
  components: {
    ValidationObserver,
    ValidationProvider,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      email: '',
      keyDownEnter: false
    }
  },

  head () {
    return {
      title: 'メールアドレス確認'
    }
  },

  created () {
    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    // Tips: IME確定のEnterやShift+Enter等で送信されないようにする
    onKeyDown (event) {
      this.keyDownEnter = event.keyCode === 13 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    },

    // メールアドレス確認
    async onConfirmationNew (invalid, keydown = false) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      await this.postConfirmationNew()
      this.processing = false
    },

    // メールアドレス確認API
    async postConfirmationNew () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.confirmationNewUrl, {
        email: this.email,
        redirect_url: this.$config.frontBaseURL + this.$config.confirmationSuccessUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          if (this.$auth.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
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
