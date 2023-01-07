<template>
  <div>
    <Loading v-if="loading" />
    <SpacesDestroyInfo v-if="!loading" :space="space" />
    <v-card v-if="!loading">
      <v-card-title>
        <v-row>
          <v-col>
            <v-avatar v-if="space.image_url != null" size="32px">
              <v-img id="space_image" :src="space.image_url.small" />
            </v-avatar>
            {{ space.name }}
            <SpacesIcon :space="space" />
          </v-col>
          <v-col cols="auto" class="d-flex pl-0">
            <v-btn
              v-if="space.current_member != null"
              id="members_btn"
              :to="`/members/${space.code}`"
              color="primary"
              dense
              nuxt
            >
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-badge :content="space.member_count > 99 ? '99+' : space.member_count" color="accent" overlap>
                    <v-icon v-bind="attrs" v-on="on">mdi-account-multiple</v-icon>
                  </v-badge>
                </template>
                メンバー一覧
              </v-tooltip>
            </v-btn>
            <v-btn
              v-if="currentMemberAdmin"
              id="space_update_btn"
              :to="`/spaces/update/${space.code}`"
              color="secondary"
              class="ml-1"
              dense
              nuxt
            >
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on">mdi-cog</v-icon>
                </template>
                設定変更
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="space.description != null && space.description !== ''">
        <template v-for="(value, index) in space.description.split('\n')">
          <div :key="index">{{ value }}</div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading,
    SpacesDestroyInfo,
    SpacesIcon
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      space: null
    }
  },

  head () {
    return {
      title: this.space?.name
    }
  },

  computed: {
    currentMemberAdmin () {
      return this.space?.current_member?.power === 'admin'
    }
  },

  async created () {
    if (!await this.getSpacesDetail()) { return }

    this.loading = false
  },

  methods: {
    // スペース情報取得
    async getSpacesDetail () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaces.detailUrl.replace(':code', this.$route.params.code))
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true }, response.data?.space == null)) { return }

          this.space = response.data.space
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
        })

      return result
    }
  }
}
</script>
