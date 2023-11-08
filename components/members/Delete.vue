<template>
  <v-btn
    id="member_delete_btn"
    icon
    variant="outlined"
    size="small"
    @click="showDialog()"
  >
    <v-icon>mdi-delete</v-icon>
    <v-tooltip activator="parent" location="bottom">メンバー解除</v-tooltip>
  </v-btn>
  <v-dialog v-model="dialog" max-width="640px" :attach="$config.public.env.test">
    <v-card id="member_delete_dialog">
      <AppProcessing v-if="processing" />
      <template v-if="dialog">
        <v-toolbar color="error" density="compact">
          <v-icon size="small" class="ml-4">mdi-delete</v-icon>
          <span class="ml-1">メンバー解除</span>
        </v-toolbar>
        <v-card-text>
          <div class="text-h6 pa-4">選択したメンバーを解除しますか？</div>
        </v-card-text>
        <v-card-actions class="justify-end mb-2 mr-2">
          <v-btn
            id="member_delete_no_btn"
            color="secondary"
            variant="elevated"
            @click="dialog = false"
          >
            いいえ（キャンセル）
          </v-btn>
          <v-btn
            id="member_delete_yes_btn"
            color="error"
            variant="elevated"
            @click="postMembersDelete()"
          >
            はい（解除）
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import AppProcessing from '~/components/app/Processing.vue'
import { redirectAuth } from '~/utils/redirect'

const $props = defineProps({
  space: {
    type: Object,
    required: true
  },
  selectedMembers: {
    type: Array,
    required: true
  }
})
const $emit = defineEmits(['messages', 'clear', 'reload'])
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const dialog = ref(false)

// ダイアログ表示
function showDialog () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if ($auth.user.destroy_schedule_at != null) { return $toast.error($t('auth.destroy_reserved')) }

  dialog.value = true
}

// メンバー解除
async function postMembersDelete () {
  processing.value = true

  const url = $config.public.members.deleteUrl.replace(':space_code', $props.space.code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'POST', {
    codes: $props.selectedMembers.map((item: any) => item.user.code)
  })

  if (response?.ok) {
    if (data != null) {
      $emit('messages', { alert: data.alert || '', notice: data.notice || '' })
      $emit('clear')
      $emit('reload')
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ notice: $t('auth.unauthenticated') })
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }

  dialog.value = false // NOTE: 失敗しても閉じる
  processing.value = false
}
</script>
