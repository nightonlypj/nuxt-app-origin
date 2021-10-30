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
        <v-btn color="primary" :disabled="invalid || image === null || processing" @click="onUserImageUpdate()">
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
                <v-btn color="primary" @click="dialog.value = false; onUserImageDelete()">
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
import Application from '~/plugins/application.js'

extend('size_20MB', size)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'ImageEdit',
  components: {
    ValidationObserver,
    ValidationProvider
  },
  mixins: [Application],

  data () {
    return {
      image: null
    }
  },

  created () {
    this.processing = false
  },

  methods: {
    async onUserImageUpdate () {
      this.processing = true

      const params = new FormData()
      params.append('image', this.image)
      await this.$axios.post(this.$config.apiBaseURL + this.$config.userImageUpdateUrl, params)
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.status === 401) {
            return this.signOut()
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.$emit('alert', error.response.data.alert)
            this.$emit('notice', error.response.data.notice)
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
        })

      this.processing = false
    },
    async onUserImageDelete () {
      this.processing = true

      await this.$axios.delete(this.$config.apiBaseURL + this.$config.userImageDeleteUrl)
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          this.image = null
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.status === 401) {
            return this.signOut()
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.$emit('alert', error.response.data.alert)
            this.$emit('notice', error.response.data.notice)
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
        })

      this.processing = false
    }
  }
}
</script>
