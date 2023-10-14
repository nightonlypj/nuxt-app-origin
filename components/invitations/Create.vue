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
                        :label="value"
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
                    {{ appTimeZoneOffset }}<span v-if="appTimeZoneShort != null">({{ appTimeZoneShort }})</span>
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

<script>
import { pickBy } from 'lodash'
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, max } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('required_select', required)
defineRule('max', max)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default defineNuxtComponent({
  components: {
    Form,
    Field,
    AppProcessing,
    AppRequiredLabel
  },
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    }
  },
  emits: ['reload'],

  data () {
    return {
      processing: false,
      waiting: false,
      dialog: false,
      invitation: this.initialInvitation()
    }
  },

  methods: {
    // 初期値
    initialInvitation () {
      return { ended_time: '23:59' }
    },

    // ダイアログ表示
    showDialog () {
      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      this.dialog = true
    },

    // 招待URL作成
    async postInvitationsCreate (setErrors, values) {
      this.processing = true

      const url = this.$config.public.invitations.createUrl.replace(':space_code', this.space.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', {
        invitation: {
          ...this.invitation,
          ended_zone: this.appTimeZoneOffset
        }
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          this.$emit('reload')
          this.dialog = false
          this.invitation = this.initialInvitation()
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, forbidden: true, reserved: true })) {
        this.appSetToastedMessage(data, true)
        if (data.errors != null) {
          setErrors(pickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvalidがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
})
</script>
