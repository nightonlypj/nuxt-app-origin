import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'

export default {
  components: {
    Loading,
    Processing,
    Message
  },

  data () {
    return {
      loading: true,
      processing: true,
      alert: null,
      notice: null
    }
  },

  methods: {
    // レスポンスチェック
    appCheckResponse (response, action = { redirect: false, toasted: false, returnKey: false }, systemError = false) {
      if (response.data == null || systemError) {
        return this.appReturnResponse(action, null, 'system.error')
      }

      return (action.returnKey) ? null : true
    },

    // エラーレスポンスチェック
    appCheckErrorResponse (error, action = { redirect: false, toasted: false, returnKey: false, require: false }, check = { auth: false, forbidden: false, notfound: false }) {
      if (error.response == null) {
        return this.appReturnResponse(action, null, 'network.failure')
      } else if (check.auth && error.response.status === 401) {
        this.appSignOut()
        return (action.returnKey) ? 'auth.unauthenticated' : false
      } else if (check.forbidden && error.response.status === 403) {
        return this.appReturnResponse(action, error.response.status, 'auth.forbidden')
      } else if (check.notfound && error.response.status === 404) {
        return this.appReturnResponse(action, error.response.status, 'system.notfound', error.response.data)
      } else if (error.response.data == null) {
        return this.appReturnResponse(action, error.response.status, 'network.error')
      }

      if (action.require) {
        return this.appReturnResponse(action, error.response.status, 'system.default', error.response.data)
      }

      return (action.returnKey) ? null : true
    },

    // レスポンス返却
    appReturnResponse (action, status, alertKey, data = null) {
      if (action.redirect) {
        this.appRedirectError(status, { alert: this.appGetAlertMessage(data, true, alertKey), notice: data?.notice })
      } else if (action.toasted) {
        this.appSetToastedMessage({ alert: this.appGetAlertMessage(data, true, alertKey), notice: data?.notice }, false)
      }
      return (action.returnKey) ? alertKey : false
    },

    // メッセージ表示
    appSetMessage (data, require) {
      this.alert = this.appGetAlertMessage(data, require)
      this.notice = data.notice
    },
    appSetEmitMessage (data, require) {
      this.$emit('alert', this.appGetAlertMessage(data, require))
      this.$emit('notice', data.notice)
    },
    appSetToastedMessage (data, require) {
      const alert = this.appGetAlertMessage(data, require)
      if (alert != null) {
        this.$toasted.error(alert)
      }
      if (data?.notice != null) {
        this.$toasted.info(data.notice)
      }
    },
    appSetQueryMessage () {
      if (Object.keys(this.$route.query).length === 0) { return }

      this.alert = this.$route.query.alert
      this.notice = this.$route.query.notice
      this.$router.push({ path: this.$route.path }) // Tips: URLパラメータを消す為
    },
    appGetAlertMessage (data, require, defaultKey = 'system.default') {
      return (require && data?.alert == null) ? this.$t(defaultKey) : data?.alert
    },

    // リダイレクト
    appRedirectAuth () {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    },
    appRedirectAlreadyAuth () {
      this.appRedirectTop({ notice: this.$t('auth.already_authenticated') })
    },
    appRedirectAlreadySignedOut () {
      this.appRedirectTop({ notice: this.$t('auth.already_signed_out') })
    },
    appRedirectDestroyReserved () {
      this.appRedirectTop({ alert: this.$t('auth.destroy_reserved') })
    },
    appRedirectNotDestroyReserved () {
      this.appRedirectTop({ alert: this.$t('auth.not_destroy_reserved') })
    },
    appRedirectTop (data = null, require = false) {
      this.appSetToastedMessage(data, require)
      this.$router.push({ path: '/' })
    },
    appRedirectSignIn (data) {
      this.$router.push({ path: '/users/sign_in', query: { alert: data.alert, notice: data.notice } })
    },
    appRedirectError (statusCode, data) {
      this.$nuxt.error({ statusCode, alert: data.alert, notice: data.notice })
    },

    // ログアウト
    async appSignOut (message = 'auth.unauthenticated', path = null, data = null) {
      try {
        await this.$auth.logout()
      } catch (error) {
        this.appCheckErrorResponse(error, { toasted: true, require: true })
      }

      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      if (message != null) {
        this.$toasted.info(this.$t(message)) // Tips: メッセージを上書き
      }
      if (path != null) {
        this.$router.push({ path, query: { alert: data.alert, notice: data.notice } })
      }
    }
  }
}
