<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <div class="d-flex">
        <NuxtLink :to="localePath('/')" width="40px" height="40px">
          <v-img src="/logo.png" width="40px" height="40px" class="ml-1" />
        </NuxtLink>
        <v-app-bar-title
          :style="`width: ${appBarTitleWidth}px`"
          class="align-self-center d-inline-block text-truncate ml-1"
        >
          <NuxtLink :to="localePath('/')" class="toolbar-title">
            {{ `${$t('app_name')}${$t('sub_title')}${$t(`env_name.${$config.public.serverEnv}`)}` }}
          </NuxtLink>
        </v-app-bar-title>
      </div>
      <v-spacer />
      <template v-if="!$auth.loggedIn">
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" :to="localePath('/users/sign_in')" rounded>
          <v-icon>mdi-login</v-icon>
          <div class="hidden-sm-and-down ml-2">{{ $t('ログイン') }}</div>
        </component>
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" :to="localePath('/users/sign_up')" rounded>
          <v-icon>mdi-account-plus</v-icon>
          <div class="hidden-sm-and-down ml-2">{{ $t('アカウント登録') }}</div>
        </component>
      </template>
      <template v-else>
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              id="header_menu_user_btn"
              class="d-inline-block"
              max-width="400px"
              variant="text"
            >
              <v-avatar size="32px">
                <v-img id="header_menu_user_image" :src="$auth.user.image_url.small" />
              </v-avatar>
              <div class="text-truncate hidden-sm-and-down ml-1">{{ $auth.user.name }}</div>
            </v-btn>
          </template>
          <v-list>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/update')" rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-account-edit</v-icon>
                {{ $t('ユーザー情報') }}
              </v-list-item-title>
            </component>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/sign_out')" rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-logout</v-icon>
                {{ $t('ログアウト') }}
              </v-list-item-title>
            </component>
          </v-list>
        </v-menu>
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" :to="localePath('/infomations')" rounded>
          <v-badge
            :content="$auth.user.infomation_unread_count"
            :model-value="$auth.user.infomation_unread_count > 0"
            max="9"
            color="error"
          >
            <v-icon size="large">mdi-bell</v-icon>
          </v-badge>
        </component>
      </template>
      <v-select
        v-if="locales.length >= 2"
        v-model="switchLocale"
        :items="locales"
        item-title="name"
        item-value="code"
        density="compact"
        variant="underlined"
        hide-details
        class="ml-1 mr-4 mb-2 switch-locale"
        style="max-width: 94px"
        @update:model-value="navigateTo(switchLocalePath(switchLocale))"
      />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="300">
      <v-list>
        <template v-if="!$auth.loggedIn">
          <!-- /* c8 ignore next */ -->
          <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/sign_in')">
            <v-list-item-title class="d-flex align-center">
              <v-icon>mdi-login</v-icon>
              <span class="ml-3">{{ $t('ログイン') }}</span>
            </v-list-item-title>
          </component>
          <!-- /* c8 ignore next */ -->
          <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/sign_up')">
            <v-list-item-title class="d-flex align-center">
              <v-icon>mdi-account-plus</v-icon>
              <span class="ml-3">{{ $t('アカウント登録') }}</span>
            </v-list-item-title>
          </component>
        </template>
        <template v-else>
          <v-list-group>
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <v-list-item-title class="d-flex align-center">
                  <v-avatar size="32px">
                    <v-img id="navigation_user_image" :src="$auth.user.image_url.small" />
                  </v-avatar>
                  <div class="text-truncate ml-1">{{ $auth.user.name }}</div>
                </v-list-item-title>
              </v-list-item>
            </template>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/update')">
              <v-list-item-title class="d-flex align-center">
                <v-icon>mdi-account-edit</v-icon>
                <span class="ml-2">{{ $t('ユーザー情報') }}</span>
              </v-list-item-title>
            </component>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/users/sign_out')">
              <v-list-item-title class="d-flex align-center">
                <v-icon>mdi-logout</v-icon>
                <span class="ml-2">{{ $t('ログアウト') }}</span>
              </v-list-item-title>
            </component>
          </v-list-group>
        </template>
        <v-divider />
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" :to="localePath('/infomations')">
          <v-list-item-title class="d-flex align-center">
            <template v-if="$auth.loggedIn">
              <v-badge
                :content="$auth.user.infomation_unread_count"
                :model-value="$auth.user.infomation_unread_count > 0"
                max="9"
                color="error"
                class="list-badge"
              >
                <v-icon>mdi-bell</v-icon>
              </v-badge>
              <span class="ml-8">{{ $t('お知らせ') }}</span>
            </template>
            <template v-else>
              <v-icon>mdi-bell</v-icon>
              <span class="ml-3">{{ $t('お知らせ') }}</span>
            </template>
          </v-list-item-title>
        </component>
        <!-- /* c8 ignore next 2 */ -->
        <component
          :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
          v-if="$auth.loggedIn"
          :to="localePath('/downloads')"
        >
          <v-list-item-title>
            <v-badge
              :content="$auth.user.undownloaded_count"
              :model-value="$auth.user.undownloaded_count > 0"
              color="red"
              class="list-badge"
            >
              <v-icon>mdi-download</v-icon>
            </v-badge>
            <span class="ml-8">{{ $t('ダウンロード結果') }}</span>
          </v-list-item-title>
        </component>
        <!-- /* c8 ignore next 2 */ -->
        <component
          :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
          v-if="$auth.loggedIn || $config.public.enablePublicSpace"
          :to="localePath('/spaces')"
        >
          <v-list-item-title>
            <v-icon>mdi-folder-open</v-icon>
            {{ $t('スペース') }}
          </v-list-item-title>
        </component>
        <template v-if="$auth.loggedIn">
          <!-- /* c8 ignore next 2 */ -->
          <component
            :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
            v-for="space in $auth.user.spaces" :id="`navigation_space_link_${space.code}`"
            :key="space.code"
            :to="localePath(`/-/${space.code}`)"
          >
            <v-list-item-title class="text-overline">
              <v-avatar v-if="space.image_url != null" size="24px">
                <v-img :id="`navigation_space_image_${space.code}`" :src="space.image_url.mini" />
              </v-avatar>
              {{ space.name }}
            </v-list-item-title>
          </component>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-3">
        <UsersDestroyInfo />
        <slot />
      </v-container>
    </v-main>

    <v-footer absolute app class="pa-2" style="border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))">
      <div class="flex-grow-1 text-center text-truncate">
        <span class="hidden-sm-and-down">Copyright </span>
        &copy; <a :href="$t('my_url')" target="_blank" rel="noopener noreferrer">{{ $t('my_name') }}</a> All Rights Reserved.
      </div>
    </v-footer>

    <AppBackToTop />
  </v-app>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'
import UsersDestroyInfo from '~/components/users/DestroyInfo.vue'
import AppBackToTop from '~/components/app/BackToTop.vue'

const display = useDisplay()
const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { $auth } = useNuxtApp()

const storageDrawer = localStorage.getItem('drawer')
const sizeLgUp = $config.public.env.test ? true : display.lgAndUp.value
const drawer = ref(storageDrawer != null ? storageDrawer === '1' && sizeLgUp : sizeLgUp)
const switchLocale = ref(locale.value)

watch(drawer, (value) => {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('drawer', value) }

  localStorage.setItem('drawer', value ? '1' : '0')
})

useHead({
  titleTemplate
})
function titleTemplate (title: string | undefined) {
  const name = `${$t('app_name')}${$t(`env_name.${$config.public.serverEnv}`)}`
  return title == null ? name : `${title} - ${name}`
}

const appBarTitleWidth = computed(() => {
  const drawerIconWidth = 10 + 48 + 4 + 40 + 4
  const switchLocaleWidth = locales.value.length >= 2 ? (display.xs.value ? 48 : 76) : 0
  if ($auth.loggedIn) {
    return display.width.value - (drawerIconWidth + (display.smAndDown.value ? 64 : 400) + 64 + switchLocaleWidth + 20)
  } else {
    const btnWidth = locale.value === 'ja' ? 119 + 166 : 104 + 184
    return display.width.value - (drawerIconWidth + (display.smAndDown.value ? 64 * 2 : btnWidth) + switchLocaleWidth + 20)
  }
})
</script>

<style scoped>
.toolbar-title {
  color: inherit !important;
  text-decoration: inherit;
}
.list-badge {
  position: absolute; /* NOTE: v-list-item-titleでv-badgeの上が隠れてしまう為 */
}
</style>
<style>
.v-btn, .text-overline {
  text-transform: none !important; /* NOTE: 大文字表示になる為 */
}
.v-btn--disabled.v-btn--variant-elevated { /* NOTE: disable時に押せると誤解する為 */
  background-color: transparent !important;
  color: rgba(var(--v-theme-on-surface), 0.26) !important;
}
.v-card-title {
  white-space: normal; /* NOTE: 文字が省略され、折り返されない為 */
}
.v-input--density-compact {
  --v-input-control-height: 32px; /* NOTE: v-switchの高さが40pxだと大きい為 */
}
.switch-locale .v-field {
  font-size: 13px;
}

.md-preview {
  border: ridge;
  border-radius: 4px;
  border-color: #1E1E1E;
  min-height: 32px
}
</style>
