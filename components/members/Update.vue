<template>
  <v-dialog v-model="dialog" max-width="720px">
    <v-card id="member_update_dialog">
      <Processing v-if="processing" />
      <validation-observer v-if="dialog" v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense>
            <v-icon dense>mdi-account-edit</v-icon>
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
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', member.invitationed_at, 'N/A') }}</span>
                  <UsersAvatar :user="member.invitationed_user" />
                </v-col>
              </v-row>
              <v-row v-if="member.last_updated_at != null || member.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 grey--text">{{ $timeFormat('ja', member.last_updated_at, 'N/A') }}</span>
                  <UsersAvatar :user="member.last_updated_user" />
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-divider />
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
              id="member_update_submit_btn"
              color="primary"
              :disabled="invalid || processing || waiting"
              @click="postMembersUpdate()"
            >
              変更
            </v-btn>
            <v-btn
              id="member_update_cancel_btn"
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
import { required } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/plugins/application.js'

extend('required_select', required)
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
      member: null
    }
  },

  methods: {
    // ダイアログ表示
    async showDialog (member) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('showDialog', member) }

      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      if (!await this.getMembersDetail(member)) { return }

      this.waiting = true
      this.dialog = true
    },

    // メンバー詳細取得
    async getMembersDetail (member) {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.members.detailUrl.replace(':space_code', this.space.code).replace(':user_code', member.user.code))
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true }, response.data?.member == null)) { return }

          this.member = response.data.member
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
        })

      return result
    },

    // メンバー情報変更
    async postMembersUpdate () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.members.updateUrl.replace(':space_code', this.space.code).replace(':user_code', this.member.user.code), {
        member: { power: this.member.power }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('update', response.data.member)
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
