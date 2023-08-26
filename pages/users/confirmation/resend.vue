<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <Form v-slot="{ meta }" ref="form">
          <v-form autocomplete="off" @submit.prevent>
            <v-card-title>メールアドレス確認</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="postConfirmationNew(!meta.valid, true)"
            >
              <Field v-slot="{ field, errors }" v-model="query.email" name="email" rules="required|email">
                <v-text-field
                  v-bind="field"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="off"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </Field>
              <v-btn
                id="confirmation_btn"
                color="primary"
                class="mt-2"
                :disabled="!meta.valid || processing || waiting"
                @click="postConfirmationNew(!meta.valid, false)"
              >
                送信
              </v-btn>
            </v-card-text>
            <v-divider v-if="!$auth?.loggedIn" />
            <v-card-actions v-if="!$auth?.loggedIn">
              <ActionLink action="confirmation" />
            </v-card-actions>
          </v-form>
        </Form>
      </v-card>
    </template>
  </div>
</template>

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import ja from '~/locales/validate.ja.ts'
import { required, email } from '@vee-validate/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default {
  components: {
    Form,
    Field,
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
        email: ''
      },
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
    // メールアドレス確認
    async postConfirmationNew (invalid, keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      await this.$axios.post(this.$config.public.apiBaseURL + this.$config.public.confirmationUrl, {
        ...this.query,
        redirect_url: this.$config.public.frontBaseURL + this.$config.public.confirmationSuccessUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          if (this.$auth?.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true })) { return }

          this.appSetMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.form.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })

      this.processing = false
    }
  }
}
</script>
