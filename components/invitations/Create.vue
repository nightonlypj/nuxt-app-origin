<template>
  <v-btn
    id="invitation_create_btn"
    color="primary"
    @click="showDialog()"
  >
    <v-icon>mdi-clipboard</v-icon>
    <span class="ml-1">招待URL作成</span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="850px" :attach="$config.public.env.test">
    <v-card id="invitation_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-clipboard</v-icon>
            <span class="ml-1">招待URL作成</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  メール<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.domains" name="domains" rules="required">
                    <v-textarea
                      id="invitation_create_domains_text"
                      v-model="invitation.domains"
                      label="許可ドメイン"
                      placeholder="example.com"
                      rows="3"
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
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-1">
                  権限<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.power" name="power" rules="required_select">
                    <v-radio-group
                      v-model="invitation.power"
                      color="primary"
                      class="mt-0 pt-0"
                      density="compact"
                      inline
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    >
                      <v-radio
                        v-for="(value, key) in $tm('enums.invitation.power')"
                        :id="`invitation_create_power_${key}`"
                        :key="key"
                        :label="String(value)"
                        :value="key"
                        class="mr-2"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  期限<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.ended_date" name="ended_date">
                    <v-text-field
                      id="invitation_create_ended_date_text"
                      v-model="invitation.ended_date"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                  <Field v-slot="{ errors }" v-model="invitation.ended_time" name="ended_time">
                    <v-text-field
                      id="invitation_create_ended_time_text"
                      v-model="invitation.ended_time"
                      type="time"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                  <div class="ml-2 mt-2">
                    {{ timeZoneOffset() }}<template v-if="timeZoneShortName() != null">({{ timeZoneShortName() }})</template>
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  メモ<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.memo" name="memo" rules="max:64">
                    <v-text-field
                      id="invitation_create_memo_text"
                      v-model="invitation.memo"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      counter="64"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="invitation_create_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postInvitationsCreate(setErrors, values)"
            >
              作成
            </v-btn>
            <v-btn
              id="invitation_create_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="dialog = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, max } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import { timeZoneOffset, timeZoneShortName } from '~/utils/display'
import { redirectAuth, redirectPath } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineRule('required', required)
defineRule('required_select', required)
defineRule('max', max)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const $props = defineProps({
  space: {
    type: Object,
    required: true
  }
})
const $emit = defineEmits(['reload'])
const $config = useRuntimeConfig()
const { t: $t, tm: $tm } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const invitation = ref<any>(initInvitation())
function initInvitation () { return { ended_time: '23:59' } }

// ダイアログ表示
function showDialog () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath('/', { alert: $t('auth.destroy_reserved') }) }

  dialog.value = true
}

// 招待URL作成
async function postInvitationsCreate (setErrors: any, values: any) {
  processing.value = true

  const url = $config.public.invitations.createUrl.replace(':space_code', $props.space.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'POST', {
    invitation: {
      ...invitation.value,
      ended_zone: timeZoneOffset.value()
    }
  })

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      $emit('reload')
      dialog.value = false
      invitation.value = initInvitation()
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
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
