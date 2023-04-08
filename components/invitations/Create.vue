<template>
  <div>
    <v-btn
      id="invitation_create_btn"
      color="primary"
      @click="showDialog()"
    >
      <v-icon dense>mdi-clipboard</v-icon>
      <span class="ml-1">招待URL作成</span>
    </v-btn>
    <v-dialog v-model="dialog" max-width="850px">
      <v-card id="invitation_create_dialog">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense>
              <v-icon dense>mdi-clipboard</v-icon>
              <span class="ml-1">招待URL作成</span>
            </v-toolbar>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                    メール&nbsp;<span class="red--text">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="domains" rules="required">
                      <v-textarea
                        v-model="invitation.domains"
                        label="許可ドメイン"
                        placeholder="example.com"
                        rows="3"
                        dense
                        outlined
                        hide-details="auto"
                        :error-messages="errors"
                        @input="waiting = false"
                      />
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                    権限&nbsp;<span class="red--text">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="power" rules="required_select">
                      <v-radio-group
                        v-model="invitation.power"
                        class="mt-0 pt-0"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(value, key) in $t('enums.invitation.power')"
                          :id="`invitation_power_${key}`"
                          :key="key"
                          :label="value"
                          :value="key"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
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
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="invitation_create_submit_btn"
                color="primary"
                :disabled="invalid || processing || waiting"
                @click="postInvitationsCreate()"
              >
                作成
              </v-btn>
              <v-btn
                id="invitation_create_cancel_btn"
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
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, max } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('required_select', required)
extend('max', max)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing
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
    async postInvitationsCreate () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.invitations.createUrl.replace(':space_code', this.space.code), {
        invitation: {
          ...this.invitation,
          ended_zone: this.appTimeZoneOffset
        }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('reload')
          this.dialog = false
          this.invitation = this.initialInvitation()
          this.$refs.observer.reset()
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
