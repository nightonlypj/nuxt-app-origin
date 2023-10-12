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
                  <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', invitation.created_at, 'N/A') }}</span>
                  <UsersAvatar :user="invitation.created_user" />
                </v-col>
              </v-row>
              <v-row v-if="invitation.last_updated_at != null || invitation.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', invitation.last_updated_at, 'N/A') }}</span>
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
                  <v-icon size="small">{{ appMemberPowerIcon(invitation.power) }}</v-icon>
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
                    {{ appTimeZoneOffset }}<span v-if="appTimeZoneShort != null">({{ appTimeZoneShort }})</span>
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
                      削除予定: {{ $dateFormat('ja', invitation.destroy_schedule_at, 'N/A') }}（{{ $timeFormat('ja', invitation.destroy_requested_at) }}に削除を受け付けています）
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

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { max } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/utils/application.js'

defineRule('max', max)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppProcessing,
    AppRequiredLabel,
    UsersAvatar
  },
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    }
  },
  emits: ['update'],

  data () {
    return {
      processing: false,
      waiting: false,
      dialog: false,
      invitation: null
    }
  },

  computed: {
    invitationURL () {
      return `${location.protocol}//${location.host}/users/sign_up?code=${this.invitation.code}`
    }
  },

  methods: {
    // ダイアログ表示
    async showDialog (invitation) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('showDialog', invitation) }

      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      if (!await this.getInvitationsDetail(invitation)) { return }
      if (this.invitation.status === 'email_joined') { return this.appSetToastedMessage({ alert: this.$t('alert.invitation.email_joined') }) }

      this.waiting = true
      this.dialog = true
    },

    // 招待URL詳細取得
    async getInvitationsDetail (invitation) {
      const url = this.$config.public.invitations.detailUrl.replace(':space_code', this.space.code).replace(':code', invitation.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { redirect: true }, data?.invitation == null)) {
          this.invitation = data.invitation
          if (this.invitation.ended_at != null) {
            const date = new Date(this.invitation.ended_at)
            this.invitation.ended_date = date.getFullYear() + '-' + `0${date.getMonth() + 1}`.slice(-2) + '-' + `0${date.getDate()}`.slice(-2)
            this.invitation.ended_time = `0${date.getHours()}`.slice(-2) + ':' + `0${date.getMinutes()}`.slice(-2)
          } else {
            this.invitation.ended_time = '23:59'
          }
          return true
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }

      return false
    },

    // 招待URL設定変更
    async postInvitationsUpdate (setErrors, values) {
      this.processing = true

      let params = {}
      if (this.invitation.delete) { params = { delete: true } }
      if (this.invitation.undo_delete) { params = { undo_delete: true } }
      const url = this.$config.public.invitations.updateUrl.replace(':space_code', this.space.code).replace(':code', this.invitation.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', {
        invitation: {
          ended_date: this.invitation.ended_date,
          ended_time: this.invitation.ended_time,
          ended_zone: this.appTimeZoneOffset,
          memo: this.invitation.memo,
          ...params
        }
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          this.$emit('update', data.invitation)
          this.dialog = false
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, forbidden: true, reserved: true })) {
        this.appSetToastedMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvalidがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
