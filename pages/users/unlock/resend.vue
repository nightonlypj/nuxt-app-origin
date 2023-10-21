<template>
  <Head>
    <Title>アカウントロック解除</Title>
  </Head>
  <AppMessage v-model:alert="alert" v-model:notice="notice" />
  <v-card max-width="480px">
    <AppProcessing v-if="processing" />
    <Form v-slot="{ meta, setErrors, values }">
      <v-form autocomplete="off" @submit.prevent>
        <v-card-title>アカウントロック解除</v-card-title>
        <v-card-text
          id="unlock_reset_area"
          @keydown.enter="appSetKeyDownEnter"
          @keyup.enter="postUnlock(!meta.valid, true, setErrors, values)"
        >
          <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
            <v-text-field
              id="unlock_reset_email_text"
              v-model="query.email"
              label="メールアドレス"
              prepend-icon="mdi-email"
              autocomplete="off"
              :error-messages="errors"
              @update:model-value="waiting = false"
            />
          </Field>
          <v-btn
            id="unlock_reset_btn"
            color="primary"
            class="mt-2"
            :disabled="!meta.valid || processing || waiting"
            @click="postUnlock(!meta.valid, false, setErrors, values)"
          >
            送信
          </v-btn>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <ActionLink action="unlock" />
        </v-card-actions>
      </v-form>
    </Form>
  </v-card>
</template>

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppProcessing,
    AppMessage,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      processing: false,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        email: ''
      },
      keyDownEnter: false
    }
  },

  created () {
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }

    this.appSetQueryMessage()
  },

  methods: {
    // アカウントロック解除
    async postUnlock (invalid, keydown, setErrors, values) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.unlockUrl, 'POST', {
        ...this.query,
        redirect_url: this.$config.public.frontBaseURL + this.$config.public.unlockRedirectUrl
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          return navigateTo({ path: this.$config.public.authRedirectSignInURL, query: { alert: data.alert, notice: data.notice } })
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true })) {
        this.appSetMessage(data, true)
        if (data.errors != null) {
          setErrors(pickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvalidがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
