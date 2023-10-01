<template>
  <v-btn
    id="member_create_btn"
    color="primary"
    @click="showDialog()"
  >
    <v-icon>mdi-account-plus</v-icon>
    <span>メンバー招待</span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="720px" :attach="$config.public.env.test">
    <v-card id="member_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-account-plus</v-icon>
            <span class="ml-1">メンバー招待</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  メンバー<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="member.emails" name="emails" rules="required">
                    <v-textarea
                      v-model="member.emails"
                      label="メールアドレス"
                      hint="アカウントが存在する場合のみ招待されます。"
                      :persistent-hint="true"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @input="waiting = false"
                    />
                  </Field>
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
                    >
                      <v-radio
                        v-for="(value, key) in $tm('enums.member.power')"
                        :id="`member_power_${key}`"
                        :key="key"
                        :label="value"
                        :value="key"
                        class="mr-2"
                        @change="waiting = false"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="member_create_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postMembersCreate(setErrors, values)"
            >
              招待
            </v-btn>
            <v-btn
              id="member_create_cancel_btn"
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
import { required } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('required_select', required)
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
  emits: ['result', 'reload'],

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
    async postMembersCreate (setErrors, values) {
      this.processing = true

      const url = this.$config.public.members.createUrl.replace(':space_code', this.space.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', {
        member: this.member
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          this.$emit('result', data)
          this.$emit('reload')
          this.dialog = false
          this.member = this.initialMember()
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
