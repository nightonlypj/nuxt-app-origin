<template>
  <v-dialog v-model="dialog" max-width="850px" :attach="$config.public.env.test">
    <v-card id="invitation_update_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-clipboard-check</v-icon>
            <span class="ml-1">招待URL設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  作成
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat('ja', invitation.created_at, 'N/A') }}</span>
                  <UsersAvatar :user="invitation.created_user" />
                </v-col>
              </v-row>
              <v-row v-if="invitation.last_updated_at != null || invitation.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat('ja', invitation.last_updated_at, 'N/A') }}</span>
                  <UsersAvatar :user="invitation.last_updated_user" />
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-divider />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                  招待URL
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <u v-if="invitation.status === 'active'">
                    {{ invitationURL }}
                  </u>
                  <s v-else>
                    {{ invitationURL }}
                  </s>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                  メールアドレス
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <template v-if="invitation.email != null">
                    {{ invitation.email }}
                  </template>
                  <template v-else>
                    <div v-for="domain in invitation.domains" :key="domain">
                      *@{{ domain }}
                    </div>
                  </template>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                  権限
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <v-icon size="small">{{ memberPowerIcon(invitation.power) }}</v-icon>
                  {{ invitation.power_i18n }}
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                  期限<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.ended_date" name="ended_date">
                    <v-text-field
                      id="invitation_update_ended_date_text"
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
                      id="invitation_update_ended_time_text"
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
                    {{ timeZoneOffset() }}<span v-if="timeZoneShortName() != null">({{ timeZoneShortName() }})</span>
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                  メモ<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="invitation.memo" name="memo" rules="max:64">
                    <v-text-field
                      id="invitation_update_memo_text"
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
              <v-row v-if="invitation.status !== 'expired'">
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 py-0 mt-2">
                  削除<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="py-0">
                  <template v-if="invitation.destroy_schedule_at == null">
                    <v-checkbox
                      id="invitation_update_delete_check"
                      v-model="invitation.delete"
                      color="primary"
                      label="削除して使用できないようにする"
                      density="compact"
                      hide-details
                      @update:model-value="waiting = false"
                    />
                    <div class="mt-2">
                      （{{ invitation.destroy_schedule_days || 'N/A' }}日後に完全に削除されます。それまでは取り消し可能です）
                    </div>
                  </template>
                  <template v-else>
                    <v-checkbox
                      id="invitation_update_undo_delete_check"
                      v-model="invitation.undo_delete"
                      color="primary"
                      label="削除を取り消して使用できるようにする"
                      density="compact"
                      hide-details
                      @update:model-value="waiting = false"
                    />
                    <div class="mt-2">
                      削除予定: {{ dateFormat('ja', invitation.destroy_schedule_at, 'N/A') }}（{{ dateTimeFormat('ja', invitation.destroy_requested_at) }}に削除を受け付けています）
                    </div>
                  </template>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="invitation_update_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postInvitationsUpdate(setErrors, values)"
            >
              変更
            </v-btn>
            <v-btn
              id="invitation_update_cancel_btn"
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
import { max } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import { dateFormat, dateTimeFormat, timeZoneOffset, timeZoneShortName } from '~/utils/display'
import { memberPowerIcon } from '~/utils/members'
import { redirectAuth, redirectError } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineRule('max', max)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const $props = defineProps({
  space: {
    type: Object,
    required: true
  }
})
defineExpose({ showDialog })
const $emit = defineEmits(['update'])
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const invitation = ref<any>(null)

const invitationURL = computed(() => `${location.protocol}//${location.host}/users/sign_up?code=${invitation.value.code}`)

// ダイアログ表示
async function showDialog (item: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('showDialog', item) }

  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if ($auth.user.destroy_schedule_at != null) { return $toast.error($t('auth.destroy_reserved')) }

  if (!await getInvitationsDetail(item)) { return }
  if (invitation.value.status === 'email_joined') { return $toast.error($t('alert.invitation.email_joined')) }

  waiting.value = true
  dialog.value = true
}

// 招待URL詳細取得
async function getInvitationsDetail (item: any) {
  const url = $config.public.invitations.detailUrl.replace(':space_code', $props.space.code).replace(':code', item.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url)

  if (response?.ok) {
    if (data?.invitation != null) {
      invitation.value = data.invitation
      if (invitation.value.ended_at != null) {
        const date = new Date(invitation.value.ended_at)
        invitation.value.ended_date = date.getFullYear() + '-' + `0${date.getMonth() + 1}`.slice(-2) + '-' + `0${date.getDate()}`.slice(-2)
        invitation.value.ended_time = `0${date.getHours()}`.slice(-2) + ':' + `0${date.getMinutes()}`.slice(-2)
      } else {
        invitation.value.ended_time = '23:59'
      }
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
    } else if (response?.status === 403) {
      redirectError(403, { alert: data?.alert || $t('auth.forbidden'), notice: data?.notice })
    } else if (response?.status === 404) {
      redirectError(404, { alert: data?.alert, notice: data?.notice })
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}

// 招待URL設定変更
async function postInvitationsUpdate (setErrors: any, values: any) {
  processing.value = true

  let params = {}
  if (invitation.value.delete) { params = { delete: true } }
  if (invitation.value.undo_delete) { params = { undo_delete: true } }
  const url = $config.public.invitations.updateUrl.replace(':space_code', $props.space.code).replace(':code', invitation.value.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'POST', {
    invitation: {
      ended_date: invitation.value.ended_date,
      ended_time: invitation.value.ended_time,
      ended_zone: timeZoneOffset.value(),
      memo: invitation.value.memo,
      ...params
    }
  })

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      $emit('update', data.invitation)
      dialog.value = false
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
