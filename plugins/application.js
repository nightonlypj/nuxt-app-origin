export default {
  computed: {
    appCurrentMemberAdmin () {
      return (space) => {
        return space?.current_member?.power === 'admin'
      }
    },
    appCurrentMemberWriter () {
      return (space) => {
        return space?.current_member?.power === 'writer'
      }
    },
    appCurrentMemberReader () {
      return (space) => {
        return space?.current_member?.power === 'reader'
      }
    },
    appCurrentMemberWriterUp () {
      return (space) => {
        return this.$config.member.power.writerUp.includes(space?.current_member?.power)
      }
    },
    appCurrentMemberReaderUp () {
      return (space) => {
        return this.$config.member.power.readerUp.includes(space?.current_member?.power)
      }
    },

    appMemberPowerIcon () {
      return (power) => {
        return this.$config.member.powerIcon[power] || this.$config.member.powerIcon.default
      }
    },

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
    appCheckResponse (response, action = { redirect: false, toasted: false, returnKey: false }, systemError = false) {
      if (response.data == null || systemError) {
        return this.appReturnResponse(action, null, 'system.error')
      }

      return (action.returnKey) ? null : true
    },

    // エラーレスポンスチェック
    appCheckErrorResponse (error, action = { redirect: false, toasted: false, returnKey: false, require: false }, check = { auth: false, forbidden: false, notfound: false, reserved: false }) {
      if (error.response == null) {
        return this.appReturnResponse(action, null, 'network.failure')
      } else if (check.auth && error.response.status === 401) {
        if (this.$auth.loggedIn) {
          this.appSignOut()
        } else if (action.redirect) {
          this.appRedirectSignIn({ alert: this.appGetAlertMessage(error.response.data, action.require, 'auth.unauthenticated'), notice: error.response.data?.notice })
        } else if (action.toasted) {
          this.appSetToastedMessage(error.response.data, action.require, 'auth.unauthenticated')
        }
        return (action.returnKey) ? 'auth.unauthenticated' : false
      } else if (check.forbidden && error.response.status === 403) {
        return this.appReturnResponse(action, error.response.status, 'auth.forbidden')
      } else if (check.notfound && error.response.status === 404) {
        return this.appReturnResponse(action, error.response.status, 'system.notfound', error.response.data)
      } else if (check.reserved && error.response.status === 406) {
        return this.appReturnResponse(action, error.response.status, 'auth.destroy_reserved', error.response.data)
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
        this.appSetToastedMessage(data, true, alertKey)
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
    appSetToastedMessage (data, require, defaultKey = 'system.default') {
      const alert = this.appGetAlertMessage(data, require, defaultKey)
      if (alert != null) { this.$toasted.error(alert) }
      if (data?.notice != null) { this.$toasted.info(data.notice) }
    },
    appSetQueryMessage () {
      if (Object.keys(this.$route.query).length === 0) { return }

      this.alert = this.$route.query.alert
      this.notice = this.$route.query.notice
      this.$router.push({ path: this.$route.path }) // NOTE: URLパラメータを消す為
    },
    appGetAlertMessage (data, require, defaultKey = 'system.default') {
      return (require && data?.alert == null) ? this.$t(defaultKey) : data?.alert
    },

    // リダイレクト
    appRedirectAuth () {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      this.$auth.redirect('login') // NOTE: ログイン後、元のページに戻す
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
    appRedirectTop (data, require = false) {
      this.appSetToastedMessage(data, require)
      this.$router.push({ path: '/' })
    },
    appRedirectSignIn (data) {
      this.$auth.$storage.setUniversal('redirect', this.$route?.fullPath)
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
        this.$toasted.info(this.$t(message)) // NOTE: メッセージを上書き
      }
      if (path != null) {
        this.$router.push({ path, query: { alert: data.alert, notice: data.notice } })
      }
    }
  }
}
