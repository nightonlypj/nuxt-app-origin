<template>
  <Head>
    <Title>{{ $t('ログイン') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta }">
        <v-form autocomplete="on">
          <v-card-title>{{ $t('ログイン') }}</v-card-title>
          <v-card-text
            id="sign_in_area"
            @keydown.enter="keyDownEnter = completInputKey($event)"
            @keyup.enter="signIn(!meta.valid, true)"
          >
            <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
              <v-text-field
                id="sign_in_email_text"
                v-model="query.email"
                :label="$t('メールアドレス')"
                prepend-icon="mdi-email"
                autocomplete="email"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required">
              <v-text-field
                id="sign_in_password_text"
                v-model="query.password"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('パスワード')"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="current-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <v-btn
              id="sign_in_btn"
              color="primary"
              class="mt-4"
              :disabled="!meta.valid || processing || waiting"
              @click="signIn(!meta.valid, false)"
            >
              {{ $t('ログイン') }}
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="sign_in" />
          </v-card-actions>
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
import { completInputKey } from '~/utils/input'
import { apiRequestURL } from '~/utils/api'
import { redirectPath, redirectConfirmationReset } from '~/utils/redirect'

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
  email: '',
  password: ''
})
const showPassword = ref(false)
const keyDownEnter = ref(false)

created()
function created () {
  const homeURL = localePath('/')
  if ($route.query.account_confirmation_success === 'true' && $auth.loggedIn) { return redirectPath(homeURL, $route.query) }
  if ($route.query.account_confirmation_success === 'false') { return redirectConfirmationReset($route.query, localePath) }
  if (['true', 'false'].includes(String($route.query.unlock)) && $auth.loggedIn) { return redirectPath(homeURL, $route.query) }
  if ($auth.loggedIn) { return redirectPath(homeURL, { notice: $t('auth.already_authenticated') }) }

  if ($route.query.account_confirmation_success === 'true' || $route.query.unlock === 'true') { messages.value.notice += $t('auth.unauthenticated') }
  if (Object.keys($route.query).length > 0) { navigateTo({}) } // NOTE: URLパラメータを消す為

  loading.value = false
}

// ログイン
async function signIn (invalid: boolean, keydown: boolean) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if (invalid || processing.value || waiting.value || (keydown && !enter)) { return }

  processing.value = true
  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.authSignInURL), 'POST', {
    ...query.value,
    unlock_redirect_url: $config.public.frontBaseURL + localePath($config.public.unlockRedirectUrl)
  })

  if (response?.ok) {
    if (data != null) {
      $auth.setData(data)
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      const { redirectUrl, updateRedirectUrl } = useAuthRedirect()
      navigateTo(redirectUrl.value || localePath($config.public.authRedirectHomeURL))
      updateRedirectUrl(null)
      return
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
      waiting.value = true
    }
  }

  processing.value = false
}
</script>
