<template>
  <div v-if="loading || errorMessage != null || existSpaces">
    <Loading v-if="loading" height="20vh" />
    <v-card v-else>
      <v-card-title>
        <v-row>
          <v-col>
            {{ $config.enablePublicSpace ? '新しい' : '' }}公開スペース
          </v-col>
          <v-col v-if="$config.enablePublicSpace" cols="auto" class="d-flex pl-0">
            <v-btn color="primary" to="/spaces" class="mr-2" nuxt>
              <v-icon dense>mdi-magnify</v-icon>
              <span class="ml-1">探す</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="errorMessage != null">
        <v-icon color="warning">mdi-alert</v-icon>
        {{ $t(`${errorMessage}_short`) }}
      </v-card-text>
      <v-card-text v-else>
        <v-list class="overflow-auto py-0" style="max-height: 200px">
          <v-list-item v-for="space in spaces" :id="`public_space_link_${space.code}`" :key="space.code" :to="`/-/${space.code}`" class="px-2" style="min-height: 42px" nuxt>
            <v-avatar v-if="space.image_url != null" size="24px">
              <v-img :id="`public_space_image_${space.code}`" :src="space.image_url.mini" />
            </v-avatar>
            <v-list-item-title class="text-overline ml-2">{{ space.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import lodash from 'lodash'
import Loading from '~/components/Loading.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      errorMessage: null,
      spaces: null
    }
  },

  computed: {
    existSpaces () {
      return this.spaces?.length > 0
    }
  },

  async created () {
    await this.getPublicSpaces()
    this.loading = false
  },

  methods: {
    // スペース一覧取得（公開）
    async getPublicSpaces () {
      const params = { text: null, public: 1, private: 0, join: 1, nojoin: 1, active: 1, destroy: 0 }
      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaces.listUrl, { params })
        .then((response) => {
          if (this.$config.debug) { this.check_search_params(params, response.data.search_params) }

          this.errorMessage = this.appCheckResponse(response, { returnKey: true })
          if (this.errorMessage != null) { return }

          this.spaces = response.data.spaces
        },
        (error) => {
          this.errorMessage = this.appCheckErrorResponse(error, { returnKey: true, require: true })
        })
    },

    check_search_params (params, responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(params, responseParams) ? 'OK' : 'NG'), params, responseParams)
    }
  }
}
</script>
