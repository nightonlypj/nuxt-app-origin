<template>
  <Head>
    <Title>招待URL: {{ textTruncate(space?.name, 64) }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <SpacesDestroyInfo :space="space" />

    <v-tabs v-model="tabPage" color="primary">
      <v-tab :to="`/-/${code}`">スペース</v-tab>
      <v-tab :to="`/members/${code}`">メンバー一覧</v-tab>
      <v-tab value="active">招待URL一覧</v-tab>
    </v-tabs>

    <v-card>
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
    </v-card>
    <v-card>
      <AppProcessing v-if="reloading" />
      <v-card-text class="pt-0">
        <v-row>
          <v-col class="d-flex py-2">
            <div class="align-self-center text-no-wrap">
              {{ localeString('ja', invitation.total_count, 'N/A') }}件
            </div>
          </v-col>
          <v-col class="d-flex justify-end">
            <InvitationsCreate
              :space="space"
              @reload="reloadInvitationsList"
            />
            <div class="ml-1">
              <AppListSetting
                v-model:hidden-items="hiddenItems"
                model="invitation"
              />
            </div>
          </v-col>
        </v-row>

        <template v-if="!processing && (invitations == null || invitations.length === 0)">
          <v-divider class="my-4" />
          <span class="ml-1">対象の招待URLが見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <InvitationsUpdate
          ref="invitationsUpdate"
          :space="space"
          @update="updateInvitation"
        />
        <template v-if="invitations != null && invitations.length > 0">
          <v-divider class="my-2" />
          <InvitationsLists
            :invitations="invitations"
            :hidden-items="hiddenItems"
            @reload="reloadInvitationsList"
            @show-update="invitationsUpdate.showDialog($event)"
          />
        </template>

        <InfiniteLoading
          v-if="!reloading && invitation != null && invitation.current_page < invitation.total_pages"
          :identifier="page"
          @infinite="getNextInvitationsList"
        >
          <template #spinner>
            <AppLoading height="10vh" class="mt-4" />
          </template>
          <template #complete />
          <template #error="{ retry }">
            <AppErrorRetry class="mt-4" @retry="error = false; retry()" />
          </template>
        </InfiniteLoading>
      </v-card-text>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import InfiniteLoading from 'v3-infinite-loading'
import AppErrorRetry from '~/components/app/ErrorRetry.vue'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppListSetting from '~/components/app/ListSetting.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import InvitationsCreate from '~/components/invitations/Create.vue'
import InvitationsUpdate from '~/components/invitations/Update.vue'
import InvitationsLists from '~/components/invitations/Lists.vue'
import { textTruncate, localeString } from '~/utils/display'
import { redirectAuth, redirectError } from '~/utils/redirect'
import { checkHeadersUid } from '~/utils/auth'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const reloading = ref(false)
const messages = ref({
  alert: '',
  notice: ''
})
const tabPage = ref('active')
const uid = ref<string | null>(null)
const error = ref(false)
const testState = ref<string | null>(null) // Vitest用
const page = ref(1)
const space = ref<any>(null)
const invitation = ref<any>(null)
const invitations = ref<any>(null)
const hiddenItems = ref(localStorage.getItem('invitation.hidden-items')?.split(',') || [])
const code = String($route.params.code)

const invitationsUpdate = ref<any>(null)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
  if (!await getInvitationsList()) { return }

  loading.value = false
}

// 招待URL一覧再取得
async function reloadInvitationsList () {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('reloadInvitationsList', reloading.value) }

  reloading.value = true
  page.value = 1

  await getInvitationsList()
  reloading.value = false
}

// 次頁の招待URL一覧取得
async function getNextInvitationsList ($state: any) {
  /* c8 ignore start */
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('getNextInvitationsList', page.value + 1, processing.value, error.value) }
  if (error.value) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
  if (processing.value) { return }
  /* c8 ignore stop */

  page.value = invitation.value.current_page + 1
  if (!await getInvitationsList()) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'error'; return }

    $state.error()
    /* c8 ignore stop */
  } else if (invitation.value.current_page < invitation.value.total_pages) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'loaded'; return }

    $state.loaded()
    /* c8 ignore stop */
  } else {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'complete'; return }

    $state.complete()
  }
  /* c8 ignore stop */
}

// 招待URL一覧取得
async function getInvitationsList () {
  processing.value = true

  const url = $config.public.invitations.listUrl.replace(':space_code', code)
  const [response, data] = await useApiRequest($config.public.apiBaseURL + url, 'GET', {
    page: page.value
  })
  if (!checkHeadersUid(response, page, uid)) { return false }

  let alert: string | null = null
  if (response?.ok) {
    if (data?.space != null && data?.invitation?.current_page === page.value) {
      space.value = data.space
      invitation.value = data.invitation
      if (reloading.value || invitations.value == null) {
        invitations.value = data.invitations?.slice()
      } else {
        invitations.value.push(...data.invitations)
      }
    } else {
      alert = $t('system.error')
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ notice: $t('auth.unauthenticated') })
      return false
    } else if (response?.status === 403) {
      alert = data?.alert || $t('auth.forbidden')
    } else if (response?.status === 404) {
      alert = data?.alert || $t('system.notfound')
    } else if (data == null) {
      alert = $t(`network.${response?.status == null ? 'failure' : 'error'}`)
    } else {
      alert = $t('system.default')
    }
  }
  if (alert != null) {
    if (invitation.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert })
      return false
    } else {
      $toast.error(alert)
      if (data?.notice != null) { $toast.info(data.notice) }
    }
  }

  page.value = invitation.value.current_page
  error.value = alert != null

  processing.value = false
  return alert == null
}

// 招待URL設定更新
function updateInvitation (invitation: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('updateInvitation', invitation) }

  const index = invitations.value.findIndex((element: any) => element.code === invitation.code)
  if (index >= 0) { invitations.value.splice(index, 1, invitation) }
}
</script>
