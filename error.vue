<template>
  <NuxtLayout>
    <Head>
      <Title>{{ title }}</Title>
      <Meta name="robots" content="noindex" />
    </Head>
    <v-card>
      <v-card-title>{{ alert }}</v-card-title>
      <v-card-text v-if="notice != null">{{ notice }}</v-card-text>
      <v-card-actions>
        <NuxtLink :to="localePath('/')" class="ml-2">{{ $t('トップページ') }}</NuxtLink>
      </v-card-actions>
    </v-card>
  </NuxtLayout>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t: $t } = useI18n()
const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  error: Object
})

const title = computed(() => $t((props.error?.statusCode === 404) ? 'Not Found' : 'エラー'))
const alert = computed(() => {
  if (props.error?.data?.alert != null) { return props.error.data.alert }
  return $t(`system.${props.error?.statusCode === 404 ? 'notfound' : 'default'}`)
})
const notice = computed(() => props.error?.data?.notice)
</script>
