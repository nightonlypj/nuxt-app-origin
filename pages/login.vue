<template>
  <div>
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          ログイン
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="email" label="メールアドレス" />
          <v-text-field v-model="password" type="password" label="パスワード" />
          <v-btn color="primary" @click="login">
            ログイン
          </v-btn>
        </v-card-text>
      </v-form>
    </v-card>
  </div>
</template>

<script>
import Message from '~/components/Message.vue'

export default {
  components: {
    Message
  },

  data () {
    return {
      email: '',
      password: '',
      alert: null,
      notice: null
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info('既にログインしています。')
      this.$auth.redirect('home')
    }
  },

  methods: {
    async login () {
      if (!this.email || !this.password) {
        this.alert = 'メールアドレスまたはパスワードが違います。'
        this.notice = null
        return
      }

      await this.$auth.loginWith('local', {
        data: {
          email: this.email,
          password: this.password
        }
      })
        .then((response) => {
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          return response
        },
        (error) => {
          if (typeof error.response === 'undefined') {
            this.$toasted.error('通信に失敗しました。しばらく時間をあけてから、やり直してください。')
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
          }
          return error
        })
    }
  }
}
</script>
