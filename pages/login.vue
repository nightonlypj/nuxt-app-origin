<template>
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
</template>

<script>
export default {
  middleware: 'auth', // TODO: トップページでalert表示「既にログインしています。」

  data () {
    return {
      email: '',
      password: ''
    }
  },

  methods: {
    async login () {
      await this.$auth.loginWith('local', {
        data: {
          email: this.email,
          password: this.password
        }
      })
        .then((response) => {
          if (response.data.alert) { console.log('[OK]alert: ' + response.data.alert) } // TODO: 遷移元ページでalert表示
          if (response.data.alert) { console.log('[OK]notice: ' + response.data.notice) } // TODO: 遷移元ページでnotice表示
          return response
        },
        (error) => {
          if (typeof error.response === 'undefined') {
            console.log('[ERROR]' + error) // TODO: alert表示
          } else {
            if (error.response.data.alert) { console.log('[NG]alert: ' + error.response.data.alert) } // TODO: alert表示
            if (error.response.data.notice) { console.log('[NG]notice: ' + error.response.data.notice) } // TODO: notice表示
          }
          return error
        })
    }
  }
}
</script>
