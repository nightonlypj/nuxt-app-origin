<template>
  <v-dialog v-model="dialog" max-width="720px">
    <v-card id="member_update_dialog">
      <validation-observer v-slot="{ invalid }" ref="observer">
        <Processing v-if="processing" />
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense dark>メンバー情報変更</v-toolbar>
          <v-card-text class="pb-0">
            <Message :alert="alert" :notice="notice" />
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0">
                  メンバー:
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <UsersAvatar :user="member.user" />
                </v-col>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                  権限:
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
                        :id="'power_' + key"
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
          <v-card-actions class="justify-end mt-4">
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
import Message from '~/components/Message.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/plugins/application.js'

extend('required_select', required)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing,
    Message,
    UsersAvatar
  },
  mixins: [Application],

  data () {
    return {
      processing: false,
      waiting: false,
      alert: null,
      notice: null,
      dialog: false,
      space: null,
      member: null
    }
  },

  methods: {
    showDialog (space, member) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('showDialog', space, member) }

      this.waiting = true
      this.alert = null
      this.notice = null
      this.space = space
      this.member = { ...member }
      this.dialog = true
    },

    // メンバー情報変更
    async postMembersUpdate () {
      this.processing = true

      const url = this.$config.membersUpdateUrl.replace(':code', this.space.code).replace(':user_code', this.member.user.code)
      await this.$axios.post(this.$config.apiBaseURL + url, {
        member: { power: this.member.power }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('update', response.data.member)
          this.dialog = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true })) { return }

          this.appSetMessage(error.response.data, true)
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
