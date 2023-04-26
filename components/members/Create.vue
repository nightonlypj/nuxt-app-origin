<template>
  <div>
    <v-btn
      id="member_create_btn"
      color="primary"
      @click="showDialog()"
    >
      <v-icon dense>mdi-account-plus</v-icon>
      <span class="ml-1">メンバー招待</span>
    </v-btn>
    <v-dialog v-model="dialog" max-width="720px">
      <v-card v-if="dialog" id="member_create_dialog">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense>
              <v-icon dense>mdi-account-plus</v-icon>
              <span class="ml-1">メンバー招待</span>
            </v-toolbar>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-2">
                    メンバー&nbsp;<span class="red--text">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="emails" rules="required">
                      <v-textarea
                        v-model="member.emails"
                        label="メールアドレス"
                        hint="アカウントが存在する場合のみ招待されます。"
                        :persistent-hint="true"
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
                        v-model="member.power"
                        class="mt-0 pt-0"
                        dense
                        row
                        hide-details="auto"
                        :error-messages="errors"
                      >
                        <v-radio
                          v-for="(value, key) in $t('enums.member.power')"
                          :id="`member_power_${key}`"
                          :key="key"
                          :label="value"
                          :value="key"
                          @change="waiting = false"
                        />
                      </v-radio-group>
                    </validation-provider>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn
                id="member_create_submit_btn"
                color="primary"
                :disabled="invalid || processing || waiting"
                @click="postMembersCreate()"
              >
                招待
              </v-btn>
              <v-btn
                id="member_create_cancel_btn"
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
import { required } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('required_select', required)
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
      member: this.initialMember()
    }
  },

  methods: {
    // 初期値
    initialMember () {
      return {}
    },

    // ダイアログ表示
    showDialog () {
      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      this.dialog = true
    },

    // メンバー招待
    async postMembersCreate () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.members.createUrl.replace(':space_code', this.space.code), {
        member: this.member
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('result', response.data)
          this.$emit('reload')
          this.dialog = false
          this.member = this.initialMember()
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
