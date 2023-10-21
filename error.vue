<template>
  <NuxtLayout>
    <Head>
      <Title>{{ title }}</Title>
      <Meta name="robots" content="noindex" />
    </Head>
    <v-card>
      <v-card-title>{{ alertMessage }}</v-card-title>
      <v-card-text v-if="noticeMessage != null">{{ noticeMessage }}</v-card-text>
      <v-card-actions>
        <NuxtLink to="/">トップページ</NuxtLink>
      </v-card-actions>
    </v-card>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  error: Object
})

const title = computed(() => (props.error?.statusCode === 404) ? 'Not Found' : 'エラー')
const alertMessage = computed(() => {
  if (props.error?.data?.alert != null) { return props.error.data.alert }
  return $t((props.error?.statusCode === 404) ? 'system.notfound' : 'system.default')
})
const noticeMessage = computed(() => props.error?.data?.notice)
</script>
