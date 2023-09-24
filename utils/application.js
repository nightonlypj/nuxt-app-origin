export default defineNuxtComponent({
  emits: ['alert', 'notice'],

  computed: {
    appTableHeight () {
      return Math.max(200, this.$vuetify.breakpoint.height - 146) + 'px'
    },

    appTimeZoneOffset () {
      // NOTE: Jestだとエラーになる -> RangeError: Value longOffset out of range for Intl.DateTimeFormat options property timeZoneName
      // const secZone = new Date().toLocaleString('default', { second: 'numeric', timeZoneName: 'longOffset' }) // 0 GMT+09:00
      // const result = secZone.match(/GMT([+-][\d]{2}:[\d]{2})/)
      // return (result != null) ? result[1] : null
      const offset = new Date().getTimezoneOffset() * -1
      const offsetAbs = Math.abs(offset)
      return (offset >= 0 ? '+' : '-') + `0${String(Math.trunc(offsetAbs / 60))}`.slice(-2) + ':' + `0${offsetAbs % 60}`.slice(-2)
    },

    appTimeZoneShort () {
      const secZone = new Date().toLocaleString('default', { second: 'numeric', timeZoneName: 'short' }) // 0 JST
      const result = secZone.match(/\s(.*)$/)
      return (result != null) ? result[1] : null
    }
  },

  methods: {
    // NOTE: IME確定のEnterやShift+Enter等で送信されないようにする（keyupのisComposingはfalseになるので、keydownで判定）
    appSetKeyDownEnter ($event) {
      this.keyDownEnter = !$event.isComposing && !$event.altKey && !$event.ctrlKey && !$event.metaKey && !$event.shiftKey
    },

    // レスポンスチェック
    appCheckResponse (data, action = { redirect: false, toasted: false, returnKey: false }, systemError = false) {
      if (data == null || systemError) {
        return this.appReturnResponse(action, null, 'system.error')
      }

      return (action.returnKey) ? null : true
    },

    // エラーレスポンスチェック
    appCheckErrorResponse (status, data, action = { redirect: false, toasted: false, returnKey: false, require: false }, check = { auth: false, forbidden: false, notfound: false, reserved: false }) {
      if (status == null && data == null) {
        return this.appReturnResponse(action, null, 'network.failure')
      } else if (check.auth && status === 401) {
        if (this.$auth.loggedIn) {
          useAuthSignOut(true)
          this.appRedirectAuth()
        } else if (action.redirect) {
          const { updateRedirectUrl } = useAuthRedirect()
          updateRedirectUrl(this.$route?.fullPath)
          navigateTo({ path: this.$config.public.authRedirectSignInURL, query: { alert: this.appGetAlertMessage(data, action.require, 'auth.unauthenticated'), notice: data?.notice } })
        } else if (action.toasted) {
          this.appSetToastedMessage(data, action.require, false, 'auth.unauthenticated')
        }
        return (action.returnKey) ? 'auth.unauthenticated' : false
      } else if (check.forbidden && status === 403) {
        return this.appReturnResponse(action, status, 'auth.forbidden')
      } else if (check.notfound && status === 404) {
        return this.appReturnResponse(action, status, 'system.notfound', data)
      } else if (check.reserved && status === 406) {
        return this.appReturnResponse(action, status, 'auth.destroy_reserved', data)
      } else if (data == null) {
        return this.appReturnResponse(action, status, 'network.error')
      }

      if (action.require) {
        return this.appReturnResponse(action, status, 'system.default', data)
      }

      return (action.returnKey) ? null : true
    },

    // レスポンス返却
    appReturnResponse (action, status, alertKey, data = null) {
      if (action.redirect) {
        this.appRedirectError(status, { alert: this.appGetAlertMessage(data, true, alertKey), notice: data?.notice || null })
      } else if (action.toasted) {
        this.appSetToastedMessage(data, true, status === 200, alertKey)
      }
      return (action.returnKey) ? alertKey : false
    },

    // メッセージ表示
    appSetMessage (data, require, defaultKey = 'system.default') {
      this.alert = this.appGetAlertMessage(data, require, defaultKey)
      this.notice = data?.notice || null
    },
    appSetEmitMessage (data, require, defaultKey = 'system.default') {
      this.$emit('alert', this.appGetAlertMessage(data, require, defaultKey))
      this.$emit('notice', data?.notice || null)
    },
    appSetToastedMessage (data, require, success = false, defaultKey = 'system.default') {
      const alert = this.appGetAlertMessage(data, require, defaultKey)
      if (alert != null) { this.$toast.error(alert) }
      if (data?.notice != null) {
        if (success) {
          this.$toast.success(data.notice)
        } else {
          this.$toast.info(data.notice)
        }
      }
    },
    appSetQueryMessage () {
      if (Object.keys(this.$route.query).length === 0) { return }

      this.alert = this.$route.query.alert
      this.notice = this.$route.query.notice
      navigateTo(this.$route.path) // NOTE: URLパラメータを消す為
    },
    appGetAlertMessage (data, require, defaultKey = 'system.default') {
      return (require && data?.alert == null) ? this.$t(defaultKey) : data?.alert
    },

    // リダイレクト
    appRedirectAuth () {
      this.appSetToastedMessage({ notice: this.$t('auth.unauthenticated') }, false, false)
      const { updateRedirectUrl } = useAuthRedirect()
      updateRedirectUrl(this.$route?.fullPath)
      navigateTo(this.$config.public.authRedirectSignInURL)
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
    appRedirectTop (data, success = false) {
      this.appSetToastedMessage(data, false, success)
      navigateTo('/')
    },
    appRedirectError (statusCode, data) {
      showError({ statusCode, data: { alert: data.alert, notice: data.notice } })
      /* c8 ignore next */ // eslint-disable-next-line no-throw-literal
      if (process.env.NODE_ENV !== 'test') { throw 'showError' }
    }
  }
})
