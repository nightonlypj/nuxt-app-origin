<template>
  <Head>
    <Title>{{ $t('メンバー') }}: {{ textTruncate(space?.name, 64) }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <SpacesDestroyInfo :space="space" />

    <v-tabs v-if="!$config.public.env.test" v-model="tabPage" color="primary">
      <v-tab :to="localePath(`/-/${code}`)">{{ $t('スペース') }}</v-tab>
      <v-tab value="list">{{ $t('メンバー一覧') }}</v-tab>
      <v-tab v-if="createResult != null" value="result">{{ $t('メンバー招待（結果）') }}</v-tab>
      <v-tab v-if="currentMemberAdmin(space)" :to="localePath(`/invitations/${code}`)">{{ $t('招待URL一覧') }}</v-tab>
    </v-tabs>

    <v-card>
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-show="tabPage === 'list'" cols="12" md="8">
            <MembersSearch
              ref="membersSearch"
              v-model:query="query"
              :processing="processing || reloading"
              :admin="currentMemberAdmin(space)"
              @search="searchMembersList"
            />
          </v-col>
          <v-col v-if="currentMemberAdmin(space)" cols="12" :md="tabPage === 'list' ? '4' : '12'" class="d-flex justify-end">
            <MembersCreate
              :space="space"
              @result="resultMembers"
              @reload="reloadMembersList"
            />
            <v-btn color="primary" :to="localePath(`/invitations/${code}`)" class="ml-1">
              <v-icon>mdi-clipboard-check</v-icon>
              <span class="ml-1">{{ $t('招待URL') }}</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-show="tabPage === 'list'" class="mt-2" style="overflow: scroll">
      <AppProcessing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col class="d-flex py-2">
            <div v-if="member != null && member.total_count > 0" class="align-self-center text-no-wrap ml-2">
              {{ $t(`{total}名（${member.total_count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, member.total_count, 'N/A') }) }}
            </div>
            <div v-if="selectedMembers.length > 0" class="d-flex">
              <div class="align-self-center text-no-wrap ml-4">
                {{ $t('選択') }}: {{ $t(`{total}名（${selectedMembers.length <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, selectedMembers.length, 'N/A') }) }}
              </div>
              <div v-if="currentMemberAdmin(space)" class="align-self-center ml-2">
                <MembersDelete
                  :space="space"
                  :selected-members="selectedMembers"
                  @messages="messages = $event"
                  @clear="selectedMembers = []"
                  @reload="reloadMembersList"
                />
              </div>
            </div>
          </v-col>
          <v-col class="d-flex justify-end">
            <AppListDownload
              v-if="currentMemberAdmin(space)"
              :admin="true"
              model="member"
              :headers="$config.public.members.headers"
              :space="space"
              :hidden-items="hiddenItems"
              :select-items="selectItems"
              :search-params="params"
            />
            <div class="ml-1">
              <AppListSetting
                v-model:hidden-items="hiddenItems"
                :admin="currentMemberAdmin(space)"
                model="member"
                :headers="$config.public.members.headers"
              />
            </div>
          </v-col>
        </v-row>

        <MembersUpdate
          v-if="currentMemberAdmin(space)"
          ref="membersUpdate"
          :space="space"
          @update="updateMember"
        />
        <template v-if="members == null || members.length === 0">
          <v-divider class="my-4" />
          <span class="ml-1">{{ $t('対象の{name}が見つかりません。', { name: $t('メンバー') }) }}</span>
          <v-divider class="my-4" />
        </template>
        <template v-else>
          <v-divider class="mt-2" />
          <MembersLists
            v-model:selected-members="selectedMembers"
            :sort="String(query.sort)"
            :desc="query.desc"
            :members="members"
            :hidden-items="hiddenItems"
            :active-user-codes="activeUserCodes"
            :admin="currentMemberAdmin(space)"
            @reload="reloadMembersList"
            @show-update="membersUpdate.showDialog($event)"
          />
          <v-divider class="mb-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && member != null && member.current_page < member.total_pages"
          :identifier="page"
          @infinite="getNextMembersList"
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

    <v-card v-if="createResult != null" v-show="tabPage === 'result'" class="mt-2">
      <v-card-text>
        <MembersResult :result="createResult" />
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
import AppListDownload from '~/components/app/ListDownload.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersDelete from '~/components/members/Delete.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import { textTruncate, localeString } from '~/utils/display'
import { currentMemberAdmin } from '~/utils/members'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectError } from '~/utils/redirect'
import { sleep, checkSearchParams } from '~/utils/search'
import { checkHeadersUid } from '~/utils/auth'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, tm: $tm, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

function getQuery (targetQuery: any = {}) {
  const power: any = {}
  const queryPower = targetQuery?.power?.split(',')
  for (const key of Object.keys($tm('enums.member.power') as any)) {
    power[key] = queryPower == null || queryPower.includes(key)
  }

  return {
    text: targetQuery?.text || null,
    power,
    active: targetQuery?.active !== '0',
    destroy: targetQuery?.destroy !== '0',
    sort: targetQuery?.sort || 'invitationed_at',
    desc: targetQuery?.desc !== '0',
    option: targetQuery?.option === '1'
  }
}

const loading = ref(true)
const processing = ref(false)
const reloading = ref(false)
const messages = ref({
  alert: '',
  notice: ''
})
const tabPage = ref('list')
const query = ref(getQuery($route.query))
const params = ref<any>(null)
const uid = ref<string | null>(null)
const error = ref(false)
const testState = ref<string | null>(null) // Vitest用
const page = ref(1)
const space = ref<any>(null)
const member = ref<any>(null)
const members = ref<any>(null)
const selectedMembers = ref([])
const localHiddenItems = localStorage.getItem('member.hidden-items')
const hiddenItems = ref((localHiddenItems == null ? $config.public.members.defaultHiddenItems : localHiddenItems)?.split(',') || [])
const createResult = ref<any>(null)
const activeUserCodes = ref([])
const code = String($route.params.code)

const membersSearch = ref<any>(null)
const membersUpdate = ref<any>(null)

const selectItems = computed(() => selectedMembers.value.map((item: any) => item.user.code))

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }
  if (!await getMembersList()) { return }

  loading.value = false
}

// メンバー一覧検索
async function searchMembersList () {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('searchMembersList') }

  params.value = null
  membersSearch.value.updateWaiting(await reloadMembersList())
}

// メンバー一覧再取得
async function reloadMembersList ($event: any = {}) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('reloadMembersList', $event, reloading.value) }

  if (Object.keys($event).length >= 0) {
    if ($event.sort != null) { query.value.sort = $event.sort }
    if ($event.desc != null) { query.value.desc = $event.desc }
  }

  // 再取得中は待機  NOTE: 異なる条件のデータが混じらないようにする為
  let count = 0
  while (count < $config.public.reloading.maxCount) {
    if (!reloading.value) { break }

    /* c8 ignore next */
    if (!$config.public.env.test) { await sleep($config.public.reloading.sleepMs) }
    count++
  }
  if (count >= $config.public.reloading.maxCount) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Stop') }

    $toast.error($t('system.timeout'))
    return false
  }
  reloading.value = true

  page.value = 1
  const result = await getMembersList()

  navigateTo({
    query: {
      ...params.value,
      active: String(params.value.active),
      destroy: String(params.value.destroy),
      desc: String(params.value.desc),
      option: String(Number(query.value.option))
    }
  })

  reloading.value = false
  return result
}

// 次頁のメンバー一覧取得
async function getNextMembersList ($state: any) {
  /* c8 ignore start */
  // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('getNextMembersList', page.value + 1, processing.value, error.value) }

  if (error.value) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
  if (processing.value) { return }
  /* c8 ignore stop */

  page.value = member.value.current_page + 1
  if (!await getMembersList()) {
    /* c8 ignore start */
    if ($state == null) { testState.value = 'error'; return }

    $state.error()
    /* c8 ignore stop */
  } else if (member.value.current_page < member.value.total_pages) {
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

// メンバー一覧取得
async function getMembersList () {
  processing.value = true

  if (params.value == null) {
    const power = []
    for (const key in query.value.power) {
      if (query.value.power[key]) { power.push(key) }
    }
    params.value = {
      ...query.value,
      text: query.value.text || '',
      power: power.join(),
      active: Number(query.value.active),
      destroy: Number(query.value.destroy),
      desc: Number(query.value.desc)
    }
    delete params.value.option
  } else {
    params.value.sort = query.value.sort
    params.value.desc = Number(query.value.desc)
  }

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.members.listUrl.replace(':space_code', code)), 'GET', {
    ...params.value,
    page: page.value
  })
  if (!checkHeadersUid(response, page, uid)) { return false }

  let alert: string | null = null
  if (response?.ok) {
    if (data?.space != null && data?.member?.current_page === page.value) {
      space.value = data.space
      member.value = data.member
      if (reloading.value || members.value == null) {
        members.value = data.members?.slice()
      } else {
        members.value.push(...data.members)
      }
      checkSearchParams(params.value, data.search_params, $t)
    } else {
      alert = $t('system.error')
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
      return false
    } else if (response?.status === 403) {
      alert = data?.alert || $t('auth.forbidden')
    } else if (response?.status === 404) {
      alert = data?.alert || $t('system.notfound')
    } else if (data == null) {
      alert = $t(`network.${response?.status == null ? 'failure' : 'error'}`)
    } else {
      alert = data.alert || $t('system.default')
    }
  }
  if (alert != null) {
    if (member.value == null) {
      redirectError(response?.ok ? null : response?.status, { alert, notice: data?.notice })
      return false
    } else {
      $toast.error(alert)
      if (data?.notice != null) { $toast.info(data.notice) }
    }
  }

  page.value = member.value.current_page
  error.value = alert != null

  processing.value = false
  return alert == null
}

// メンバー招待（結果）
function resultMembers (result: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('resultMembers', result) }

  createResult.value = result
  activeUserCodes.value = result?.user_codes
  tabPage.value = 'result'
}

// メンバー情報更新
function updateMember (item: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('updateMember', item) }

  activeUserCodes.value = [item.user.code] as any
  const index = members.value.findIndex((element: any) => element.user.code === item.user.code)
  if (index >= 0) { members.value.splice(index, 1, item) }
}
</script>
