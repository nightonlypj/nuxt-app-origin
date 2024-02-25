<template>
  <Head>
    <Title>{{ $t('パスワード再設定') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-card-title>{{ $t('パスワード再設定') }}</v-card-title>
          <v-card-text
            id="password_update_area"
            @keydown.enter="keyDownEnter = completInputKey($event)"
            @keyup.enter="postPasswordUpdate(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required|min:8">
              <v-text-field
                id="password_update_password_text"
                v-model="query.password"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('新しいパスワード')"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="required|confirmed_new_password:@password">
              <v-text-field
                id="password_update_password_confirmation_text"
                v-model="query.password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('新しいパスワード(確認)')"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <v-btn
              id="password_update_btn"
              color="primary"
              class="mt-4"
              :disabled="!meta.valid || processing || waiting"
              @click="postPasswordUpdate(!meta.valid, false, setErrors, values)"
            >
              {{ $t('変更') }}
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

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { required, min, confirmed } from '@vee-validate/rules'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import { completInputKey, existKeyErrors } from '~/utils/input'
import { apiRequestURL } from '~/utils/api'
import { redirectPath, redirectPasswordReset } from '~/utils/redirect'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

setLocale(locale.value)
defineRule('required', required)
defineRule('min', min)
defineRule('confirmed_new_password', confirmed)

const loading = ref(true)
const processing = ref(false)
const waiting = ref(false)
const messages = ref({
  alert: '',
  notice: ''
})
const query = ref({
  password: '',
  password_confirmation: ''
})
const showPassword = ref(false)
const keyDownEnter = ref(false)

created()
function created () {
  if ($auth.loggedIn) { return redirectPath(localePath('/'), { notice: $t('auth.already_authenticated') }) }
  if ($route.query.reset_password === 'false') { return redirectPasswordReset($route.query, localePath) }
  if (!$route.query.reset_password_token) { return redirectPasswordReset({ alert: $t('auth.reset_password_token_blank') }, localePath) }

  loading.value = false
}

// パスワード再設定
async function postPasswordUpdate (invalid: boolean, keydown: boolean, setErrors: any, values: any) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if (invalid || processing.value || waiting.value || (keydown && !enter)) { return }

  processing.value = true
  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.passwordUpdateUrl), 'POST', {
    reset_password_token: $route.query.reset_password_token,
    ...query.value
  })

  if (response?.ok) {
    if (data != null) {
      $auth.setData(data)
      return redirectPath(localePath('/'), data, true)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else if (data.errors == null) {
      return redirectPasswordReset({ alert: data.alert || $t('system.default'), notice: data.notice }, localePath)
    } else {
      messages.value = {
        alert: data.alert || $t('system.default'),
        notice: data.notice || ''
      }
      setErrors(existKeyErrors.value(data.errors, values))
      waiting.value = true
    }
  }

  processing.value = false
}
</script>
