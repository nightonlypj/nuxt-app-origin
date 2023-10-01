<template>
  <template v-if="loading || errorMessage != null || existSpaces">
    <AppLoading v-if="loading" height="20vh" />
    <v-card v-else>
      <v-card-title>
        <v-row>
          <v-col>
            {{ $config.public.enablePublicSpace ? '新しい' : '' }}公開スペース
          </v-col>
          <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex pl-0">
            <NuxtLink to="/spaces">
              <v-btn color="primary" class="mr-2">
                <v-icon>mdi-magnify</v-icon>
                <span class="ml-1">探す</span>
              </v-btn>
            </NuxtLink>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="errorMessage != null">
        <v-icon color="warning">mdi-alert</v-icon>
        {{ $t(`${errorMessage}_short`) }}
      </v-card-text>
      <v-card-text v-else>
        <v-list class="overflow-auto py-0" style="max-height: 200px">
          <component
            :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
            v-for="space in spaces"
            :id="`public_space_link_${space.code}`"
            :key="space.code" :to="`/-/${space.code}`"
            class="px-2"
            style="min-height: 42px"
          >
            <v-list-item-title class="text-overline">
              <v-avatar v-if="space.image_url != null" size="24px">
                <v-img :id="`public_space_image_${space.code}`" :src="space.image_url.mini" />
              </v-avatar>
              {{ space.name }}
            </v-list-item-title>
          </component>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import lodash from 'lodash'
import AppLoading from '~/components/app/Loading.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading
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
      const params = { text: '', public: 1, private: 0, join: 1, nojoin: 1, active: 1, destroy: 0 }
      const url = this.$config.public.spaces.listUrl + '?' + new URLSearchParams(params)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.$config.public.debug) { this.check_search_params(params, data.search_params) }

        this.errorMessage = this.appCheckResponse(data, { returnKey: true })
        if (this.errorMessage == null) {
          this.spaces = data.spaces
        }
      } else {
        this.errorMessage = this.appCheckErrorResponse(response?.status, data, { returnKey: true, require: true })
      }
    },

    check_search_params (params, responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(params, responseParams) ? 'OK' : 'NG'), params, responseParams)
    }
  }
})
</script>
