<template>
  <v-dialog v-model="dialog" max-width="850px">
    <v-card id="invitation_update_dialog">
      <Processing v-if="processing" />
      <validation-observer v-if="dialog" v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense>
            <v-icon dense>mdi-clipboard-check</v-icon>
            <span class="ml-1">招待URL設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  作成
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', invitation.created_at, 'N/A') }}</span>
                  <UsersAvatar :user="invitation.created_user" />
                </v-col>
              </v-row>
              <v-row v-if="invitation.last_updated_at != null || invitation.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', invitation.last_updated_at, 'N/A') }}</span>
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
                  <v-icon dense>{{ appMemberPowerIcon(invitation.power) }}</v-icon>
                  {{ invitation.power_i18n }}
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                  期限
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <validation-provider v-slot="{ errors }" name="ended_date">
                    <v-text-field
                      v-model="invitation.ended_date"
                      type="date"
                      dense
                      outlined
                      hide-details="auto"
                      :error-messages="errors"
                      @input="waiting = false"
                    />
                  </validation-provider>
                  <validation-provider v-slot="{ errors }" name="ended_time">
                    <v-text-field
                      v-model="invitation.ended_time"
                      type="time"
                      dense
                      outlined
                      hide-details="auto"
                      :error-messages="errors"
                      @input="waiting = false"
                    />
                  </validation-provider>
                  <div class="ml-2 mt-2">
                    {{ appTimeZoneOffset }}<span v-if="appTimeZoneShort != null">({{ appTimeZoneShort }})</span>
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                  メモ
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <validation-provider v-slot="{ errors }" name="memo" rules="max:64">
                    <v-text-field
                      v-model="invitation.memo"
                      dense
                      outlined
                      hide-details="auto"
                      counter="64"
                      :error-messages="errors"
                      @input="waiting = false"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row v-if="invitation.status !== 'expired'">
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 py-0 mt-2">
                  削除
                </v-col>
                <v-col cols="12" md="10" class="py-0">
                  <template v-if="invitation.destroy_schedule_at == null">
                    <v-checkbox
                      id="invitation_delete_check"
                      v-model="invitation.delete"
                      label="削除して使用できないようにする"
                      dense
                      hide-details
                      @change="waiting = false"
                    />
                    <div class="mt-2">
                      （{{ invitation.destroy_schedule_days || 'N/A' }}日後に完全に削除されます。それまでは取り消し可能です）
                    </div>
                  </template>
                  <template v-else>
                    <v-checkbox
                      id="invitation_undo_delete_check"
                      v-model="invitation.undo_delete"
                      label="削除を取り消して使用できるようにする"
                      dense
                      hide-details
                      @change="waiting = false"
                    />
                    <div class="mt-2">
                      削除予定: {{ $dateFormat('ja', invitation.destroy_schedule_at, 'N/A') }}（{{ $timeFormat('ja', invitation.destroy_requested_at) }}に削除を受け付けています）
                    </div>
                  </template>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              id="invitation_update_submit_btn"
              color="primary"
              :disabled="invalid || processing || waiting"
              @click="postInvitationsUpdate()"
            >
              変更
            </v-btn>
            <v-btn
              id="invitation_update_cancel_btn"
              color="secondary"
              @click="dialog = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </v-dialog>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { max } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/plugins/application.js'

extend('max', max)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing,
    UsersAvatar
  },
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    }
  },

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
      if (this.$config.debug) { console.log('showDialog', invitation) }

      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      if (!await this.getInvitationsDetail(invitation)) { return }
      if (this.invitation.status === 'email_joined') { return this.appSetToastedMessage({ alert: this.$t('alert.invitation.email_joined') }) }

      this.waiting = true
      this.dialog = true
    },

    // 招待URL詳細取得
    async getInvitationsDetail (invitation) {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.invitations.detailUrl.replace(':space_code', this.space.code).replace(':code', invitation.code))
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true }, response.data?.invitation == null)) { return }

          this.invitation = response.data.invitation
          if (this.invitation.ended_at != null) {
            const date = new Date(this.invitation.ended_at)
            this.invitation.ended_date = date.getFullYear() + '-' + `0${date.getMonth() + 1}`.slice(-2) + '-' + `0${date.getDate()}`.slice(-2)
            this.invitation.ended_time = `0${date.getHours()}`.slice(-2) + ':' + `0${date.getMinutes()}`.slice(-2)
          } else {
            this.invitation.ended_time = '23:59'
          }
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
        })

      return result
    },

    // 招待URL設定変更
    async postInvitationsUpdate () {
      this.processing = true

      let params = {}
      if (this.invitation.delete) { params = { delete: true } }
      if (this.invitation.undo_delete) { params = { undo_delete: true } }
      await this.$axios.post(this.$config.apiBaseURL + this.$config.invitations.updateUrl.replace(':space_code', this.space.code).replace(':code', this.invitation.code), {
        invitation: {
          ended_date: this.invitation.ended_date,
          ended_time: this.invitation.ended_time,
          ended_zone: this.appTimeZoneOffset,
          memo: this.invitation.memo,
          ...params
        }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('update', response.data.invitation)
          this.dialog = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true, reserved: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })

      this.processing = false
    }
  }
}
</script>
