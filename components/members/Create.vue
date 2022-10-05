<template>
  <v-dialog max-width="720px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="member_create_btn"
        color="primary"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-icon dense>mdi-account-plus</v-icon>
        <span class="ml-1">メンバー招待</span>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="member_create_dialog">
        <validation-observer v-slot="{ invalid }" ref="observer">
          <Processing v-if="processing" />
          <v-form autocomplete="off">
            <v-toolbar color="primary" dense dark>
              <v-icon dense>mdi-account-plus</v-icon>
              <span class="ml-1">メンバー招待</span>
            </v-toolbar>
            <v-card-text>
              <Message :alert="alert" :notice="notice" />
              <v-container>
                <v-row>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                    メンバー&nbsp;<span style="color: red">*</span>
                  </v-col>
                  <v-col cols="12" md="10" class="pb-0">
                    <validation-provider v-slot="{ errors }" name="emails" rules="required">
                      <v-textarea
                        v-model="member.emails"
                        label="メールアドレス"
                        dense
                        outlined
                        hide-details="auto"
                        :error-messages="errors"
                        @input="waiting = false"
                      />
                    </validation-provider>
                  </v-col>
                  <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0">
                    権限&nbsp;<span style="color: red">*</span>
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
            <v-card-actions class="justify-end">
              <v-btn
                id="member_create_submit_btn"
                color="primary"
                :disabled="invalid || processing || waiting"
                @click="postMembersCreate(dialog)"
              >
                招待
              </v-btn>
              <v-btn
                id="member_create_cancel_btn"
                color="secondary"
                @click="dialog.value = false"
              >
                キャンセル
              </v-btn>
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required } from 'vee-validate/dist/rules'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('required_select', required)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Processing,
    Message
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
      alert: null,
      notice: null,
      member: {
        emails: '',
        power: null
      }
    }
  },

  methods: {
    initialize () {
      this.alert = null
      this.notice = null
    },

    // メンバー招待
    async postMembersCreate ($dialog) {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.membersCreateUrl.replace(':code', this.space.code), {
        member: this.member
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('result', response.data)
          this.$emit('reload')
          $dialog.value = false
          this.member = {
            emails: '',
            power: null
          }
          this.$refs.observer.reset()
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
