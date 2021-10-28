<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <v-form>
      <v-card-text>
        <v-avatar size="256px">
          <v-img :src="$auth.user.image_url.xlarge" />
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
            <v-btn color="secondary" :disabled="!$auth.user.upload_image || processing" v-bind="attrs" v-on="on">
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
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { size } from 'vee-validate/dist/rules'

extend('size_20MB', size)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider
  },

  data () {
    return {
      processing: false,
      image: null
    }
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
            this.$emit('alert', error.response.data.alert)
            this.$emit('notice', error.response.data.notice)
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
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
            this.$emit('alert', error.response.data.alert)
            this.$emit('notice', error.response.data.notice)
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
