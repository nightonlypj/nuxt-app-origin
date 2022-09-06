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
    appCheckResponse (response, action = { redirect: false, toasted: false, returnMessage: false }, systemError = false) {
      if (response.data == null || systemError) {
        if (action.redirect) {
          this.appRedirectError(null, { alert: this.$t('system.error') })
        } else if (action.toasted) {
          this.$toasted.error(this.$t('system.error'))
        }
        return (action.returnMessage) ? 'system.error' : false
      }

      return (action.returnMessage) ? null : true
    },

    // エラーレスポンスチェック
    appCheckErrorResponse (error, action = { redirect: false, toasted: false, returnMessage: false, require: false }, check = { auth: false, notfound: false }) {
      if (error.response == null) {
        if (action.redirect) {
          this.appRedirectError(null, { alert: this.$t('network.failure') })
        } else if (action.toasted) {
          this.$toasted.error(this.$t('network.failure'))
        }
        return (action.returnMessage) ? 'network.failure' : false
      } else if (check.auth && error.response.status === 401) {
        this.appSignOut()
        return false
      } else if (check.notfound && error.response.status === 404) {
        this.appRedirectError(error.response.status, error.response.data)
        return false
      } else if (error.response.data == null) {
        if (action.redirect) {
          this.appRedirectError(error.response.status, { alert: this.$t('network.error') })
        } else if (action.toasted) {
          this.$toasted.error(this.$t('network.error'))
        }
        return (action.returnMessage) ? 'network.error' : false
      }

      if (action.redirect) {
        this.appRedirectError(error.response.status, error.response.data)
        return false
      } else if (action.require) {
        if (action.toasted) {
          this.$toasted.error(this.$t('system.default'))
        }
        return (action.returnMessage) ? 'system.default' : false
      }

      return true
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
    appGetAlertMessage (data, require) {
      return (require && data?.alert == null) ? this.$t('system.default') : data?.alert
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
