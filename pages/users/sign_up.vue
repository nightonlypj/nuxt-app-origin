<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          アカウント登録
        </v-card-title>
        <v-card-text>
          <validation-provider v-slot="{ errors }" name="name" rules="required">
            <v-text-field
              v-model="name"
              label="氏名"
              prepend-icon="mdi-account"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="email" rules="required|email">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-icon="mdi-email"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
            <v-text-field
              v-model="password"
              type="password"
              label="パスワード [8文字以上]"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed:password">
            <v-text-field
              v-model="password_confirmation"
              type="password"
              label="パスワード(確認)"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              :error-messages="errors"
            />
          </validation-provider>
          <v-btn color="primary" :disabled="invalid" @click="signUp">
            登録
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <ul>
            <li>
              <NuxtLink to="/users/sign_in">
                ログイン
              </NuxtLink>
            </li>
          </ul>
        </v-card-actions>
      </v-form>
    </v-card>
  </validation-observer>
</template>

<script>
import { required, email, min, confirmed } from 'vee-validate/dist/rules'
import { extend, ValidationObserver, ValidationProvider, setInteractionMode } from 'vee-validate'
import Message from '~/components/Message.vue'

setInteractionMode('eager')

extend('required', {
  ...required,
  message: '入力してください。'
})
extend('email', {
  ...email,
  message: '形式が正しくありません。'
})
extend('min', {
  ...min,
  message: '{length}文字以上で入力してください。'
})
extend('confirmed', {
  ...confirmed,
  message: 'パスワードと一致しません。'
})

export default {
  name: 'UsersSignUp',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info('既にログインしています。')
      return this.$router.push({ path: '/' })
    }
  },

  methods: {
    async signUp () {
      await this.$axios.post('http://localhost:3000/users/auth/sign_up.json', {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        confirm_success_url: 'http://localhost:5000/users/sign_in'
      })
        .then((response) => {
          return this.$router.push({ path: '/users/sign_in', query: { alert: response.data.alert, notice: response.data.notice } })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error('通信に失敗しました。しばらく時間をあけてから、やり直してください。')
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            this.$refs.observer.setErrors(error.response.data.errors)
          }
          return error
        })
    }
  }
}
</script>
