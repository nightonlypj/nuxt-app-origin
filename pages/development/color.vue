<template>
  <Head>
    <Title>{{ $t('テーマカラー確認') }}</Title>
  </Head>
  <template v-if="!loading">
    <v-alert type="error" icon="mdi-alert" class="mb-2" closable>error(mdi-alert)</v-alert><!-- NOTE: mdi-alert追加 -->
    <v-alert type="info" class="mb-2" closable>info</v-alert>
    <v-alert type="warning" class="mb-2" closable>warning</v-alert>
    <v-alert type="success" class="mb-2" closable>success</v-alert>

    <v-card>
      <v-card-text class="pb-3">
        <div>
          <v-btn color="primary" class="mb-2 mr-2" @click="copyText('primary')">primary</v-btn>
          <v-btn color="primary-darken-1" class="mb-2 mr-2" @click="copyText('primary-darken-1')">primary-darken-1</v-btn>
          <v-btn color="secondary" class="mb-2 mr-2" @click="copyText('secondary')">secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mb-2 mr-2" @click="copyText('secondary-darken-1')">secondary-darken-1</v-btn>
          <v-btn color="error" class="mb-2 mr-2" @click="copyText('error')">error</v-btn>
          <v-btn color="info" class="mb-2 mr-2" @click="copyText('info')">info</v-btn>
          <v-btn color="warning" class="mb-2 mr-2" @click="copyText('warning')">warning</v-btn>
          <v-btn color="success" class="mb-2 mr-2" @click="copyText('success')">success</v-btn>
          <v-btn class="mb-2 mr-2">undefined</v-btn>
          <v-btn color="accent" class="mb-2 mr-2" @click="copyText('accent')">accent(custom)</v-btn>
        </div>
        <div>
          <v-btn color="primary" class="mb-2 mr-2" disabled>primary</v-btn>
          <v-btn color="primary-darken-1" class="mb-2 mr-2" disabled>primary-darken-1</v-btn>
          <v-btn color="secondary" class="mb-2 mr-2" disabled>secondary</v-btn>
          <v-btn color="secondary-darken-1" class="mb-2 mr-2" disabled>secondary-darken-1</v-btn>
          <v-btn color="error" class="mb-2 mr-2" disabled>error</v-btn>
          <v-btn color="info" class="mb-2 mr-2" disabled>info</v-btn>
          <v-btn color="warning" class="mb-2 mr-2" disabled>warning</v-btn>
          <v-btn color="success" class="mb-2 mr-2" disabled>success</v-btn>
          <v-btn class="mb-2 mr-2" disabled>undefined</v-btn>
          <v-btn color="accent" class="mb-2 mr-2" disabled>accent(custom)</v-btn>
        </div>
        <div>
          <span class="text-primary mr-2">text-primary</span>
          <span class="text-primary-darken-1 mr-2">text-primary-darken-1</span>
          <span class="text-secondary mr-2">text-secondary</span>
          <span class="text-secondary-darken-1 mr-2">text-secondary-darken-1</span>
          <span class="text-error mr-2">text-error</span>
          <span class="text-info mr-2">text-info</span>
          <span class="text-warning mr-2">text-warning</span>
          <span class="text-success mr-2">text-success</span>
          <span class="mr-2">undefined</span>
          <span class="text-accent mr-2">text-accent(custom)</span>
          <span class="text-grey mr-2">text-grey(Material color)</span>
        </div>
        <div class="mt-4">
          <a href="https://vuetifyjs.com/en/styles/colors/#material-colors" target="_blank" rel="noopener noreferrer">Material color palette — Vuetify</a>
        </div>
        <div>
          <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noopener noreferrer">Material Design Icons - Icon Library - Pictogrammers</a>
        </div>
        <div>
          <a href="https://vuetifyjs.com/en/styles/text-and-typography/" target="_blank" rel="noopener noreferrer">Text and typography — Vuetify</a>
        </div>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $toast } = useNuxtApp()
const loading = ref(true)

/* c8 ignore start */
if (!$config.public.developmentMenu) {
  showError({ statusCode: 404 })
  /* c8 ignore stop */
} else {
  loading.value = false

  $toast.error('error')
  $toast.info('info')
  $toast.warning('warning')
  $toast.success('success')
}

// クリップボードにコピー
async function copyText (text: string) {
  try {
    await navigator.clipboard.writeText(text)

    $toast.success($t('クリップボードコピー成功', { text }))
  /* c8 ignore start */
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }

    $toast.error($t('クリップボードコピー失敗'))
  }
  /* c8 ignore stop */
}
</script>

<style>
.Vue-Toastification__toast--error {
  background-color: rgb(var(--v-theme-error))
 }
 .Vue-Toastification__toast--info {
  background-color: rgb(var(--v-theme-info))
 }
 .Vue-Toastification__toast--warning {
  background-color: rgb(var(--v-theme-warning))
 }
 .Vue-Toastification__toast--success {
  background-color: rgb(var(--v-theme-success))
 }
</style>
