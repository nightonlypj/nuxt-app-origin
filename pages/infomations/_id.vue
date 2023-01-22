<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <div v-if="infomation != null">
        <v-card-title>
          <InfomationsLabel :infomation="infomation" />
          <span class="ml-1 font-weight-bold">
            {{ infomation.title }}
          </span>
          <span class="ml-1">
            ({{ $dateFormat('ja', infomation.started_at, 'N/A') }})
          </span>
        </v-card-title>
        <v-card-text>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="infomation.body" class="mx-2 my-2" v-html="infomation.body" />
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-else-if="infomation.summary" class="mx-2 my-2" v-html="infomation.summary" />
        </v-card-text>
        <v-divider />
      </div>
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/infomations">一覧</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading,
    InfomationsLabel
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      infomation: null
    }
  },

  head () {
    return {
      title: this.title
    }
  },

  computed: {
    title () {
      let label = ''
      if (this.infomation?.label_i18n != null && this.infomation?.label_i18n !== '') {
        label = `[${this.infomation.label_i18n}]`
      }
      return label + (this.infomation?.title || '')
    }
  },

  async created () {
    if (!await this.getInfomationsDetail()) { return }

    this.loading = false
  },

  methods: {
    // お知らせ詳細取得
    async getInfomationsDetail () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomations.detailUrl.replace(':id', this.$route.params.id))
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true }, response.data?.infomation == null)) { return }

          this.infomation = response.data.infomation
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { notfound: true })
        })

      return result
    }
  }
}
</script>
