<template>
  <Head>
    <Title>{{ title }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <SpacesDestroyInfo :space="space" />
    <v-card>
      <v-card-title>
        <v-row>
          <v-col>
            <v-avatar v-if="space.image_url != null" size="48px">
              <v-img id="space_image" :src="space.image_url.medium" />
            </v-avatar>
            {{ space.name }}
            <SpacesIcon :space="space" />
          </v-col>
          <v-col cols="12" sm="auto" class="d-flex justify-end pl-0">
            <v-btn
              v-if="space.current_member != null"
              id="members_btn"
              :to="`/members/${space.code}`"
              color="primary"
            >
              <v-badge
                :content="space.member_count"
                :model-value="space.member_count > 0"
                max="99"
                color="accent"
              >
                <v-icon size="large">mdi-account-multiple</v-icon>
              </v-badge>
              <v-tooltip activator="parent" location="bottom">メンバー一覧</v-tooltip>
            </v-btn>
            <v-btn
              v-if="appCurrentMemberAdmin(space)"
              id="space_update_btn"
              :to="`/spaces/update/${space.code}`"
              color="secondary"
              class="ml-1"
            >
              <v-icon>mdi-cog</v-icon>
              <v-tooltip activator="parent" location="bottom">設定変更</v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-text v-if="space.description != null && space.description !== ''" class="pb-1">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="(space.description)" />
        <!-- TODO: div v-html="$md.render(space.description)" / -->
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import AppLoading from '~/components/app/Loading.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading,
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

  computed: {
    title () {
      return this.space?.name
    }
  },

  async created () {
    if (!await this.getSpacesDetail()) { return }

    this.loading = false
  },

  methods: {
    // スペース情報取得
    async getSpacesDetail () {
      const url = this.$config.public.spaces.detailUrl.replace(':code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.appCheckResponse(data, { redirect: true }, data?.space == null)) {
          this.space = data.space
          return true
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true, forbidden: true, notfound: true })
      }

      return false
    }
  }
})
</script>
