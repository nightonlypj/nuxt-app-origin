<template>
  <Head>
    <Title>パスワード再設定</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:alert="alert" v-model:notice="notice" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off" @submit.prevent>
          <v-card-title>パスワード再設定</v-card-title>
          <v-card-text
            id="password_reset_area"
            @keydown.enter="appSetKeyDownEnter"
            @keyup.enter="postPassword(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
              <v-text-field
                id="password_reset_email_text"
                v-model="query.email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <v-btn
              id="password_reset_btn"
              color="primary"
              class="mt-2"
              :disabled="!meta.valid || processing || waiting"
              @click="postPassword(!meta.valid, false, setErrors, values)"
            >
              送信
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="password" />
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </template>
</template>

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
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
    AppLoading,
    AppProcessing,
    AppMessage,
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

  created () {
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }

    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    // パスワード再設定
    async postPassword (invalid, keydown, setErrors, values) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.passwordUrl, 'POST', {
        ...this.query,
        redirect_url: this.$config.public.frontBaseURL + this.$config.public.passwordRedirectUrl
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
