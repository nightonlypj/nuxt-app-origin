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
                  <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', member.invitationed_at, 'N/A') }}</span>
                  <UsersAvatar :user="member.invitationed_user" />
                </v-col>
              </v-row>
              <v-row v-if="member.last_updated_at != null || member.last_updated_user != null">
                <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                  更新
                </v-col>
                <v-col cols="12" md="10" class="d-flex pb-0">
                  <span class="align-self-center mr-3 text-grey">{{ $timeFormat('ja', member.last_updated_at, 'N/A') }}</span>
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
                    >
                      <v-radio
                        v-for="(value, key) in $tm('enums.member.power')"
                        :id="`member_power_${key}`"
                        :key="key"
                        :label="value"
                        :value="key"
                        class="mr-2"
                        @update:model-value="waiting = false"
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

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/utils/application.js'

defineRule('required_select', required)
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
      member: null
    }
  },

  methods: {
    // ダイアログ表示
    async showDialog (member) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('showDialog', member) }

      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      if (!await this.getMembersDetail(member)) { return }

      this.waiting = true
      this.dialog = true
    },

    // メンバー詳細取得
    async getMembersDetail (member) {
      const url = this.$config.public.members.detailUrl.replace(':space_code', this.space.code).replace(':user_code', member.user.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { redirect: true }, data?.member == null)) {
          this.member = data.member
          return true
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }

      return false
    },

    // メンバー情報変更
    async postMembersUpdate (setErrors, values) {
      this.processing = true

      const url = this.$config.public.members.updateUrl.replace(':space_code', this.space.code).replace(':user_code', this.member.user.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', {
        member: { power: this.member.power }
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetToastedMessage(data, false, true)
          this.$emit('update', data.member)
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
