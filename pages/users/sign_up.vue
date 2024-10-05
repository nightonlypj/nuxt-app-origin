<template>
  <Head>
    <Title>{{ $t('アカウント登録') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="on">
          <v-card-title>{{ $t('アカウント登録') }}</v-card-title>
          <v-card-text>
            <Field v-slot="{ errors }" v-model="query.name" name="name" rules="required|max:32">
              <v-text-field
                id="sign_up_name_text"
                v-model="query.name"
                :label="$t('氏名')"
                prepend-icon="mdi-account"
                autocomplete="name"
                counter="32"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <Field v-if="invitation == null || invitation.email != null" v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
              <v-text-field
                id="sign_up_email_text"
                v-model="query.email"
                :label="$t('メールアドレス')"
                prepend-icon="mdi-email"
                autocomplete="email"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <div v-else class="d-flex">
              <Field v-slot="{ errors }" v-model="query.email_local" name="email" rules="required">
                <v-text-field
                  id="sign_up_email_local_text"
                  v-model="query.email_local"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="off"
                  :error-messages="errors"
                  @update:model-value="waiting = false"
                />
              </Field>
              <Field v-slot="{ errors }" v-model="query.email_domain" name="email_domain" rules="required_select">
                <v-select
                  v-model="query.email_domain"
                  :items="invitation.domains"
                  prefix="@"
                  :error-messages="errors"
                  @update:model-value="waiting = false"
                />
              </Field>
            </div>
            <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required|min:8">
              <v-text-field
                id="sign_up_password_text"
                v-model="query.password"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('パスワード')"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="required|confirmed_password:@password">
              <v-text-field
                id="sign_up_password_confirmation_text"
                v-model="query.password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                :label="$t('パスワード(確認)')"
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
              id="sign_up_btn"
              color="primary"
              class="mt-4"
              :disabled="!meta.valid || processing || waiting"
              @click="postSingUp(setErrors, values)"
            >
              {{ $t('登録') }}
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="sign_up" />
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import { apiRequestURL } from '~/utils/api'
import { redirectPath, redirectError, redirectSignIn } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

setLocale(locale.value)
defineRule('required', required)
defineRule('required_select', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed_password', confirmed)

const loading = ref(true)
const processing = ref(false)
const waiting = ref(false)
const messages = ref({
  alert: '',
  notice: ''
})
const invitation = ref<any>(null)
const query = ref({
  name: '',
  email: '',
  email_local: '',
  email_domain: '',
  password: '',
  password_confirmation: ''
})
const showPassword = ref(false)

created()
async function created () {
  if ($auth.loggedIn) { return redirectPath(localePath('/'), { notice: $t('auth.already_authenticated') }) }
  if ($route.query?.code != null && !await getUserInvitation()) { return }

  loading.value = false
}

// 招待情報取得
async function getUserInvitation () {
  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.userInvitationUrl), 'GET', {
    code: $route.query.code
  })

  if (response?.ok) {
    if (data?.invitation == null || (data.invitation.email == null && data.invitation.domains == null)) {
      redirectError(null, { alert: $t('system.error') })
    } else {
      invitation.value = data.invitation
      if (data.invitation.email != null) {
        query.value.email = data.invitation.email
      } else {
        query.value.email_local = ''
        query.value.email_domain = data.invitation.domains[0]
      }
      return true
    }
  } else {
    if (response?.status === 404) {
      redirectError(404, { alert: data?.alert, notice: data?.notice })
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}

// アカウント登録
async function postSingUp (setErrors: any, values: any) {
  processing.value = true

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.singUpUrl), 'POST', {
    ...query.value,
    confirm_success_url: $config.public.frontBaseURL + localePath($config.public.singUpSuccessUrl)
  })

  if (response?.ok) {
    if (data != null) {
      return redirectSignIn(data, localePath)
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
