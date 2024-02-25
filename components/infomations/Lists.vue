<template>
  <template v-if="infomations != null && infomations.length > 0">
    <article
      v-for="infomation in infomations"
      :id="`infomation_list_${infomation.id}`"
      :key="infomation.id"
      @dblclick="redirectInfomation(infomation)"
    >
      <div class="d-flex align-center">
        <InfomationsLabel :infomation="infomation" class="mr-1" />
        <span class="font-weight-bold">
          <template v-if="infomation.body_present">
            <NuxtLink :to="localePath(`/infomations/${infomation.id}`)">{{ infomation.title }}</NuxtLink>
          </template>
          <template v-else>
            {{ infomation.title }}
          </template>
        </span>
        <span class="ml-1">
          ({{ dateFormat(locale, infomation.started_at, 'N/A') }})
        </span>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="infomation.summary" class="ma-2" v-html="infomation.summary" />
      <v-divider class="my-4" />
    </article>
  </template>
</template>

<script setup lang="ts">
import InfomationsLabel from '~/components/infomations/Label.vue'
import { dateFormat } from '~/utils/display'

defineProps({
  infomations: {
    type: [Object],
    default: null
  }
})
const localePath = useLocalePath()
const { locale } = useI18n()

function redirectInfomation (infomation: any) {
  if (!infomation.body_present) { return }

  navigateTo(localePath(`/infomations/${infomation.id}`))
}
</script>
