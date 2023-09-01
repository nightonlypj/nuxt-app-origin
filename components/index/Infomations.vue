<template>
  <div v-if="loading || errorMessage != null || existInfomations">
    <Loading v-if="loading" height="20vh" />
    <v-card v-else>
      <v-card-title>大切なお知らせ</v-card-title>
      <v-card-text v-if="errorMessage != null">
        <v-icon color="warning">mdi-alert</v-icon>
        {{ $t(`${errorMessage}_short`) }}
      </v-card-text>
      <v-card-text v-else>
        <article v-for="infomation in infomations" :key="infomation.id" class="mb-1">
          <InfomationsLabel :infomation="infomation" />
          <span class="ml-1">
            <template v-if="infomation.body_present || infomation.summary !== null">
              <NuxtLink :to="`/infomations/${infomation.id}`">{{ infomation.title }}</NuxtLink>
            </template>
            <template v-else>
              {{ infomation.title }}
            </template>
          </span>
          <span class="ml-1">
            ({{ $dateFormat('ja', infomation.started_at, 'N/A') }})
          </span>
        </article>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Application from '~/utils/application.js'

export default {
  components: {
    Loading,
    InfomationsLabel
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      errorMessage: null,
      infomations: null
    }
  },

  computed: {
    existInfomations () {
      return this.infomations?.length > 0
    }
  },

  async created () {
    await this.getInfomationsImportant()
    this.loading = false
  },

  methods: {
    // 大切なお知らせ一覧取得
    async getInfomationsImportant () {
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.infomations.importantUrl)

      if (response?.ok) {
        this.errorMessage = this.appCheckResponse(data, { returnKey: true })
        if (this.errorMessage != null) { return }

        this.infomations = data.infomations
      } else {
        this.errorMessage = this.appCheckErrorResponse(response?.status, data, { returnKey: true, require: true })
      }
    }
  }
}
</script>
