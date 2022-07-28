<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="850px">
      <v-card-title>登録情報変更</v-card-title>
      <v-row>
        <v-col cols="auto" md="4">
          <ImageEdit @alert="alert = $event" @notice="notice = $event" />
        </v-col>
        <v-col cols="12" md="8">
          <InfoEdit :user="user" @alert="alert = $event" @notice="notice = $event" />
        </v-col>
      </v-row>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li v-if="user != null && user.unconfirmed_email !== null"><NuxtLink to="/users/confirmation/new">メールアドレス確認</NuxtLink></li>
          <li><NuxtLink to="/users/delete">アカウント削除</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'
import ImageEdit from '~/components/users/edit/ImageEdit.vue'
import InfoEdit from '~/components/users/edit/InfoEdit.vue'

export default {
  components: {
    ImageEdit,
    InfoEdit
  },
  mixins: [Application],

  data () {
    return {
      user: null
    }
  },

  head () {
    return {
      title: '登録情報変更'
    }
  },

  async created () {
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      if (error.response == null) {
        this.$toasted.error(this.$t('network.failure'))
      } else if (error.response.status === 401) {
        return this.appSignOut()
      } else {
        this.$toasted.error(this.$t('network.error'))
      }
      return this.$router.push({ path: '/' })
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    }
    if (this.$auth.user.destroy_schedule_at !== null) {
      return this.appRedirectDestroyReserved()
    }

    await this.$axios.get(this.$config.apiBaseURL + this.$config.userShowUrl)
      .then((response) => {
        if (response.data == null) {
          this.$toasted.error(this.$t('system.error'))
          return this.$router.push({ path: '/' })
        } else {
          this.user = response.data.user
        }
      },
      (error) => {
        if (error.response == null) {
          this.$toasted.error(this.$t('network.failure'))
        } else if (error.response.status === 401) {
          return this.appSignOut()
        } else {
          this.$toasted.error(this.$t('network.error'))
        }
        return this.$router.push({ path: '/' })
      })

    this.loading = false
  }
}
</script>
