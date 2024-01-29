<template>
  <Head>
    <Title>{{ $t('メールアドレス確認') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off" @submit.prevent>
          <v-card-title>{{ $t('メールアドレス確認') }}</v-card-title>
          <v-card-text
            id="confirmation_resend_area"
            @keydown.enter="keyDownEnter = completInputKey($event)"
            @keyup.enter="postConfirmation(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
              <v-text-field
                id="confirmation_resend_email_text"
                v-model="query.email"
                :label="$t('メールアドレス')"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <v-btn
              id="confirmation_resend_btn"
              color="primary"
              class="mt-2"
              :disabled="!meta.valid || processing || waiting"
              @click="postConfirmation(!meta.valid, false, setErrors, values)"
            >
              {{ $t('送信') }}
            </v-btn>
          </v-card-text>
          <template v-if="!$auth.loggedIn">
            <v-divider />
            <v-card-actions>
              <ActionLink action="confirmation" />
            </v-card-actions>
          </template>
        </v-form>
      </Form>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { required, email } from '@vee-validate/rules'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import { completInputKey, existKeyErrors } from '~/utils/input'
import { redirectPath, redirectSignIn } from '~/utils/redirect'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

setLocale(locale.value)
defineRule('required', required)
defineRule('email', email)

const loading = ref(true)
const processing = ref(false)
const waiting = ref(false)
const messages = ref({
  alert: String($route.query.alert || ''),
  notice: String($route.query.notice || '')
})
const query = ref({
  email: ''
})
const keyDownEnter = ref(false)

if (Object.keys($route.query).length > 0) { navigateTo({}) } // NOTE: URLパラメータを消す為
loading.value = false

// メールアドレス確認
async function postConfirmation (invalid: boolean, keydown: boolean, setErrors: any, values: any) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if (invalid || processing.value || waiting.value || (keydown && !enter)) { return }

  processing.value = true
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.confirmationUrl, 'POST', {
    ...query.value,
    redirect_url: $config.public.frontBaseURL + localePath($config.public.confirmationSuccessUrl)
  })

  if (response?.ok) {
    if (data != null) {
      return $auth.loggedIn ? redirectPath(localePath('/'), data, true) : redirectSignIn(data, localePath)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      messages.value = {
        alert: data.alert || $t('system.default'),
        notice: data.notice || ''
      }
      if (data.errors != null) {
        setErrors(existKeyErrors.value(data.errors, values))
        waiting.value = true
      }
    }
  }

  processing.value = false
}
</script>
