<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          パスワード再設定
        </v-card-title>
        <v-card-text>
          <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
            <v-text-field
              v-model="password"
              type="password"
              label="新しいパスワード [8文字以上]"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_new_password:password">
            <v-text-field
              v-model="password_confirmation"
              type="password"
              label="新しいパスワード(確認)"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              :error-messages="errors"
            />
          </validation-provider>
          <v-btn color="primary" :disabled="invalid" @click="updatePassword">
            変更
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <ul>
            <li>
              <NuxtLink to="/users/sign_in">
                ログイン
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/users/sign_up">
                アカウント登録
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/users/confirmation/new">
                メールアドレス確認
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/users/unlock/new">
                アカウントロック解除
              </NuxtLink>
            </li>
          </ul>
        </v-card-actions>
      </v-form>
    </v-card>
  </validation-observer>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, confirmed } from 'vee-validate/dist/rules'
import Message from '~/components/Message.vue'

extend('required', required)
extend('min', min)
extend('confirmed_new_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersPasswordIndex',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      password: '',
      password_confirmation: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_authenticated'))
      return this.$router.push({ path: '/' })
    }

    if (!this.$route.query.reset_password_token) {
      return this.$router.push({ path: '/users/password/new', query: { alert: this.$t(reset_password_token_blank) } })
    }
  },

  methods: {
    async updatePassword () {
      await this.$axios.put(this.$config.apiBaseURL + this.$config.passwordUpdateUrl, {
        reset_password_token: this.$route.query.reset_password_token,
        password: this.password,
        password_confirmation: this.password_confirmation
      })
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          return this.$router.push({ path: '/' })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
          return error
        })
    }
  }
}
</script>
