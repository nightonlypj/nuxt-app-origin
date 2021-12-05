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
    appSetQueryMessage () {
      this.alert = this.$route.query.alert
      this.notice = this.$route.query.notice
      this.$router.push({ path: this.$route.path }) // Tips: URLパラメータを消す為
    },
    appRedirectAuth () {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    },
    appRedirectAlreadyAuth () {
      this.$toasted.info(this.$t('auth.already_authenticated'))
      this.$router.push({ path: '/' })
    },
    appRedirectDestroyReserved () {
      this.$toasted.info(this.$t('auth.destroy_reserved'))
      this.$router.push({ path: '/' })
    },
    appRedirectSuccess (alert, notice) {
      this.$toasted.error(alert)
      this.$toasted.info(notice)
      this.$router.push({ path: '/' })
    },
    appRedirectSignIn (alert, notice) {
      this.$router.push({ path: '/users/sign_in', query: { alert, notice } })
    },
    async appSignOut (message = 'auth.unauthenticated', path = null, alert = null, notice = null) {
      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      if (message !== null) {
        this.$toasted.info(this.$t(message))
      }
      if (path !== null) {
        this.$router.push({ path, query: { alert, notice } })
      }
    }
  }
}
