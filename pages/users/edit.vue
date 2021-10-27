<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="850px">
      <v-card-title>
        登録情報変更
      </v-card-title>
      <v-row>
        <v-col cols="6" md="4">
          <validation-observer v-slot="{ invalid }" ref="imageObserver">
            <v-form>
              <v-card-text>
                <v-avatar size="256px">
                  <v-img :src="user.image_url.xlarge" />
                </v-avatar>
                <validation-provider v-slot="{ errors }" name="image" rules="size_20MB:20480">
                  <v-file-input
                    v-model="image"
                    accept="image/jpeg,image/gif,image/png"
                    label="画像ファイル"
                    prepend-icon="mdi-camera"
                    show-size
                    :error-messages="errors"
                  />
                </validation-provider>
                <v-btn color="primary" :disabled="invalid || image === null || processing" @click="userImageUpdate">
                  アップロード
                </v-btn>
                <v-dialog transition="dialog-top-transition" max-width="600px">
                  <template #activator="{ on, attrs }">
                    <v-btn color="secondary" :disabled="!user.upload_image || processing" v-bind="attrs" v-on="on">
                      画像削除
                    </v-btn>
                  </template>
                  <template #default="dialog">
                    <v-card>
                      <v-toolbar color="secondary" dark>
                        画像削除
                      </v-toolbar>
                      <v-card-text>
                        <div class="text-h6 pa-6">
                          本当に削除しますか？
                        </div>
                      </v-card-text>
                      <v-card-actions class="justify-end">
                        <v-btn color="secondary" @click="dialog.value = false">
                          いいえ
                        </v-btn>
                        <v-btn color="primary" @click="dialog.value = false; userImageDelete()">
                          はい
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </v-dialog>
              </v-card-text>
            </v-form>
          </validation-observer>
        </v-col>
        <v-col cols="12" md="8">
          <validation-observer v-slot="{ invalid }" ref="observer">
            <v-form autocomplete="off">
              <v-card-text>
                <validation-provider v-slot="{ errors }" name="name" rules="required">
                  <v-text-field
                    v-model="name"
                    label="氏名"
                    prepend-icon="mdi-account"
                    autocomplete="off"
                    :error-messages="errors"
                  />
                </validation-provider>
                <v-alert v-if="user.unconfirmed_email !== null" color="info">
                  確認待ち: {{ user.unconfirmed_email }}<br>
                  <small>※メールを確認してください。メールが届いていない場合は[メールアドレス確認]をしてください。</small>
                </v-alert>
                <validation-provider v-slot="{ errors }" name="email" rules="required|email">
                  <v-text-field
                    v-model="email"
                    label="メールアドレス"
                    prepend-icon="mdi-email"
                    autocomplete="off"
                    :error-messages="errors"
                  />
                </validation-provider>
                <validation-provider v-slot="{ errors }" name="password" rules="min:8">
                  <v-text-field
                    v-model="password"
                    type="password"
                    label="パスワード [8文字以上] (変更する場合のみ)"
                    prepend-icon="mdi-lock"
                    append-icon="mdi-eye-off"
                    autocomplete="new-password"
                    :error-messages="errors"
                  />
                </validation-provider>
                <validation-provider v-slot="{ errors }" name="password_confirmation" rules="confirmed_password:password">
                  <v-text-field
                    v-model="password_confirmation"
                    type="password"
                    label="パスワード(確認) (変更する場合のみ)"
                    prepend-icon="mdi-lock"
                    append-icon="mdi-eye-off"
                    autocomplete="new-password"
                    :error-messages="errors"
                  />
                </validation-provider>
                <validation-provider v-slot="{ errors }" name="current_password" rules="required">
                  <v-text-field
                    v-model="current_password"
                    type="password"
                    label="現在のパスワード"
                    prepend-icon="mdi-lock"
                    append-icon="mdi-eye-off"
                    autocomplete="off"
                    :error-messages="errors"
                  />
                </validation-provider>
                <v-btn color="primary" :disabled="invalid || processing" @click="userUpdate">
                  変更
                </v-btn>
              </v-card-text>
            </v-form>
          </validation-observer>
        </v-col>
      </v-row>
      <v-card-actions>
        <ul>
          <li v-if="user.unconfirmed_email !== null">
            <NuxtLink to="/users/confirmation/new">
              メールアドレス確認
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/users/delete">
              アカウント削除
            </NuxtLink>
          </li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { size, required, email, min, confirmed } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'

extend('size_20MB', size)
extend('required', required)
extend('email', email)
extend('min', min)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersEdit',

  components: {
    ValidationObserver,
    ValidationProvider,
    Loading,
    Message
  },

  data () {
    return {
      loading: true,
      processing: true,
      alert: null,
      notice: null,
      user: null,
      image: null,
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      current_password: ''
    }
  },

  async created () {
    await this.$auth.fetchUser()

    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    }
    if (this.$auth.user.destroy_schedule_at !== null) {
      this.$toasted.error(this.$t('auth.destroy_reserved'))
      return this.$router.push({ path: '/' })
    }

    await this.$axios.get(this.$config.apiBaseURL + this.$config.userShowUrl)
      .then((response) => {
        this.user = response.data.user
        this.name = response.data.user.name
        this.email = response.data.user.email
      },
      (error) => {
        if (error.response == null) {
          this.$toasted.error(this.$t('network.failure'))
          return this.$router.push({ path: '/' })
        }
        if (error.response.status === 401) {
          return this.signOut()
        }

        this.$toasted.error(this.$t('network.error'))
        return this.$router.push({ path: '/' })
      })

    this.processing = false
    this.loading = false
  },

  methods: {
    async signOut () {
      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      this.$toasted.info(this.$t('auth.unauthenticated'))
    },
    userImageUpdate () {
      this.processing = true
      const params = new FormData()
      params.append('image', this.image)
      this.$axios.post(this.$config.apiBaseURL + this.$config.userImageUpdateUrl, params)
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)

          this.image = null
          this.user.image_url = response.data.user.image_url
          this.user.upload_image = response.data.user.upload_image
          this.processing = false
          return response
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            return this.signOut()
          }

          if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.imageObserver.setErrors(error.response.data.errors) }
          } else {
            this.$toasted.error(this.$t('network.error'))
          }
          this.processing = false
          return error
        })
    },
    userImageDelete () {
      this.processing = true
      this.$axios.delete(this.$config.apiBaseURL + this.$config.userImageDestroyUrl)
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)

          this.user.image_url = response.data.user.image_url
          this.user.upload_image = response.data.user.upload_image
          this.processing = false
          return response
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            return this.signOut()
          }

          if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.imageObserver.setErrors(error.response.data.errors) }
          } else {
            this.$toasted.error(this.$t('network.error'))
          }
          this.processing = false
          return error
        })
    },
    userUpdate () {
      this.processing = true
      this.$axios.put(this.$config.apiBaseURL + this.$config.userUpdateUrl, {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        current_password: this.current_password
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
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            return this.signOut()
          }

          if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          } else {
            this.$toasted.error(this.$t('network.error'))
          }
          this.processing = false
          return error
        })
    }
  }
}
</script>
