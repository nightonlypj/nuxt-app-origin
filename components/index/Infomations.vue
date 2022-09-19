<template>
  <div v-if="loading || errorMessage != null || existInfomations">
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <v-card-title>大切なお知らせ</v-card-title>
      <v-card-text v-if="errorMessage != null">
        <v-icon color="warning">mdi-alert</v-icon>
        {{ $t(errorMessage + '_short') }}
      </v-card-text>
      <v-card-text v-else>
        <article v-for="infomation in infomations" :key="infomation.id" class="mb-1">
          <InfomationsLabel :infomation="infomation" />
          <span class="ml-1">
            <template v-if="infomation.body_present === true || infomation.summary !== null">
              <NuxtLink :to="'/infomations/' + infomation.id">{{ infomation.title }}</NuxtLink>
            </template>
            <template v-else>
              {{ infomation.title }}
            </template>
          </span>
          <span class="ml-1">
            ({{ $dateFormat(infomation.started_at, 'ja', 'N/A') }})
          </span>
        </article>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'
import InfomationsLabel from '~/components/infomations/Label.vue'

export default {
  components: {
    InfomationsLabel
  },
  mixins: [Application],

  data () {
    return {
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
    await this.getImportantInfomations()
    this.loading = false
  },

  methods: {
    // 大切なお知らせAPI
    async getImportantInfomations () {
      await this.$axios.get(this.$config.apiBaseURL + this.$config.importantInfomationsUrl)
        .then((response) => {
          this.errorMessage = this.appCheckResponse(response, { returnKey: true })
          if (this.errorMessage != null) { return }

          this.infomations = response.data.infomations
        },
        (error) => {
          this.errorMessage = this.appCheckErrorResponse(error, { returnKey: true, require: true })
        })
    }
  }
}
</script>
