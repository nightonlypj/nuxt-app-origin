<template>
  <v-btn
    id="member_create_btn"
    color="primary"
    @click="showDialog()"
  >
    <v-icon>mdi-account-plus</v-icon>
    <span>{{ $t('メンバー招待（ボタン）') }}</span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="720px" :attach="$config.public.env.test">
    <v-card id="member_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-account-plus</v-icon>
            <span class="ml-1">{{ $t('メンバー招待') }}</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-3" :style="$vuetify.display.mdAndUp ? 'height: 52px': ''">
                  {{ $t('メンバー') }}<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="member.emails" name="emails" rules="required">
                    <v-textarea
                      id="member_create_emails_text"
                      v-model="member.emails"
                      :label="$t('メールアドレス')"
                      :hint="$t('メンバー招待メッセージ')"
                      :persistent-hint="true"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-1">
                  {{ $t('権限') }}<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="member.power" name="power" rules="required_select">
                    <v-radio-group
                      v-model="member.power"
                      color="primary"
                      class="mt-0 pt-0"
                      density="compact"
                      inline
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    >
                      <v-radio
                        v-for="(value, key) in $tm('enums.member.power')"
                        :id="`member_create_power_${key}`"
                        :key="key"
                        :label="String(value)"
                        :value="key"
                        class="mr-2"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="member_create_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postMembersCreate(setErrors, values)"
            >
              {{ $t('招待') }}
            </v-btn>
            <v-btn
              id="member_create_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="dialog = false"
            >
              {{ $t('キャンセル') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { required } from '@vee-validate/rules'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

const $props = defineProps({
  space: {
    type: Object,
    required: true
  }
})
const $emit = defineEmits(['result', 'reload'])
const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, tm: $tm, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()

setLocale(locale.value)
defineRule('required', required)
defineRule('required_select', required)

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const member = ref<any>(initMember())
function initMember () { return {} }

// ダイアログ表示
function showDialog () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }
  if ($auth.user.destroy_schedule_at != null) { return $toast.error($t('auth.destroy_reserved')) }

  dialog.value = true
}

// メンバー招待
async function postMembersCreate (setErrors: any, values: any) {
  processing.value = true

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.members.createUrl.replace(':space_code', $props.space.code)), 'POST', {
    member: member.value
  })

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      $emit('result', data)
      $emit('reload')
      dialog.value = false
      member.value = initMember()
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
      if (data.errors != null) {
        setErrors(existKeyErrors.value(data.errors, values))
        waiting.value = true
      }
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }

  processing.value = false
}
</script>
