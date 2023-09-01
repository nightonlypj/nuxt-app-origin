<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <Form v-slot="{ meta, setErrors, values }">
          <v-form autocomplete="off" @submit.prevent>
            <v-card-title>メールアドレス確認</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="postConfirmationNew(!meta.valid, true, setErrors, values)"
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
                @click="postConfirmationNew(!meta.valid, false, setErrors, values)"
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
import ja from '~/locales/validate.ja'
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
    async postConfirmationNew (invalid, keydown, setErrors, values) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.confirmationUrl, 'POST',
        JSON.stringify({
          ...this.query,
          redirect_url: this.$config.public.frontBaseURL + this.$config.public.confirmationSuccessUrl
        })
      )

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        if (this.$auth?.loggedIn) {
          this.appRedirectTop(data)
        } else {
          this.appRedirectSignIn(data)
        }
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true })) { return }

        this.appSetMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvaildがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
}
</script>
