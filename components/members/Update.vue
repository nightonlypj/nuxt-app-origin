<template>
  <v-dialog v-model="dialog" max-width="720px" :attach="$config.public.env.test">
    <v-card id="member_update_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-account-edit</v-icon>
            <span class="ml-1">メンバー情報変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0">
                  メンバー
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <UsersAvatar :user="member.user" />
                  <div class="mt-1">
                    {{ member.user.email }}
                  </div>
                </v-col>
              </v-row>
              <v-row v-if="member.invitationed_at != null || member.invitationed_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  招待
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat('ja', member.invitationed_at, 'N/A') }}</span>
                  <UsersAvatar :user="member.invitationed_user" />
                </v-col>
              </v-row>
              <v-row v-if="member.last_updated_at != null || member.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat('ja', member.last_updated_at, 'N/A') }}</span>
                  <UsersAvatar :user="member.last_updated_user" />
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-divider />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-1">
                  権限<AppRequiredLabel />
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
                        :id="`member_update_power_${key}`"
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
              id="member_update_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postMembersUpdate(setErrors, values)"
            >
              変更
            </v-btn>
            <v-btn
              id="member_update_cancel_btn"
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
import { required } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import { dateTimeFormat } from '~/utils/display'
import { redirectAuth, redirectError } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineRule('required_select', required)
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
const { t: $t, tm: $tm } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const member = ref<any>(null)

// ダイアログ表示
async function showDialog (item: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('showDialog', item) }

  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if ($auth.user.destroy_schedule_at != null) { return $toast.error($t('auth.destroy_reserved')) }

  if (!await getMembersDetail(item)) { return }

  waiting.value = true
  dialog.value = true
}

// メンバー詳細取得
async function getMembersDetail (item: any) {
  const url = $config.public.members.detailUrl.replace(':space_code', $props.space.code).replace(':user_code', item.user.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url)

  if (response?.ok) {
    if (data?.member != null) {
      member.value = data.member
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ notice: $t('auth.unauthenticated') })
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

// メンバー情報変更
async function postMembersUpdate (setErrors: any, values: any) {
  processing.value = true

  const url = $config.public.members.updateUrl.replace(':space_code', $props.space.code).replace(':user_code', member.value.user.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'POST', {
    member: { power: member.value.power }
  })

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      $emit('update', data.member)
      dialog.value = false
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
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
