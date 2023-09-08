<template>
  <div>
    <Head>
      <Title>{{ title }}</Title>
    </Head>
    <AppLoading v-if="loading" />
    <v-card v-else>
      <template v-if="infomation != null">
        <v-card-title>
          <div>
            <InfomationsLabel :infomation="infomation" />
            <span class="font-weight-bold">
              {{ infomation.title }}
            </span>
            ({{ $dateFormat('ja', infomation.started_at, 'N/A') }})
          </div>
        </v-card-title>
        <v-card-text>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="infomation.body" class="mx-2 my-2" v-html="infomation.body" />
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-else-if="infomation.summary" class="mx-2 my-2" v-html="infomation.summary" />
        </v-card-text>
        <v-divider />
      </template>
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/infomations">一覧</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import AppLoading from '~/components/app/Loading.vue'
import InfomationsLabel from '~/components/infomations/Label.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppLoading,
    InfomationsLabel
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      infomation: null
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

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.infomations.detailUrl.replace(':id', this.$route.params.id))

      if (response?.ok) {
        if (!this.appCheckResponse(data, { redirect: true }, data?.infomation == null)) { return }

        this.infomation = data.infomation
        result = true
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { notfound: true })
      }

      return result
    }
  }
})
</script>
