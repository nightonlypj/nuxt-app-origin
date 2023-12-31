<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <NuxtLink to="/" class="toolbar-title d-flex">
        <v-img src="/logo.png" max-width="40px" max-height="40px" />
        <v-app-bar-title
          v-if="$vuetify.display.width > (48 + 40 - 16 + 64 * 2)"
          :style="{ 'max-width': ($vuetify.display.width - (48 + 40 - 16 + 64 * 2)) + 'px' }"
          class="ml-1 align-self-center d-inline-block text-truncate"
        >
          {{ `${$t('app_name')}${$t('sub_title')}${$config.public.envName}` }}
        </v-app-bar-title>
      </NuxtLink>
      <v-spacer />
      <template v-if="!$auth.loggedIn">
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" to="/users/sign_in" rounded>
          <v-icon>mdi-login</v-icon>
          <div class="hidden-sm-and-down">ログイン</div>
        </component>
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" to="/users/sign_up" rounded>
          <v-icon>mdi-account-plus</v-icon>
          <div class="hidden-sm-and-down">アカウント登録</div>
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
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/update" rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-account-edit</v-icon>
                ユーザー情報
              </v-list-item-title>
            </component>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/sign_out" rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-logout</v-icon>
                ログアウト
              </v-list-item-title>
            </component>
          </v-list>
        </v-menu>
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-btn'" to="/infomations" rounded>
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
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="300">
      <v-list>
        <template v-if="!$auth.loggedIn">
          <!-- /* c8 ignore next */ -->
          <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/sign_in">
            <v-list-item-title>
              <v-icon>mdi-login</v-icon>
              ログイン
            </v-list-item-title>
          </component>
          <!-- /* c8 ignore next */ -->
          <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/sign_up">
            <v-list-item-title>
              <v-icon>mdi-account-plus</v-icon>
              アカウント登録
            </v-list-item-title>
          </component>
        </template>
        <template v-else>
          <v-list-group>
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <v-list-item-title class="d-flex">
                  <v-avatar size="32px">
                    <v-img id="navigation_user_image" :src="$auth.user.image_url.small" />
                  </v-avatar>
                  <div class="text-truncate ml-1">{{ $auth.user.name }}</div>
                </v-list-item-title>
              </v-list-item>
            </template>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/update">
              <v-list-item-title>
                <v-icon>mdi-account-edit</v-icon>
                ユーザー情報
              </v-list-item-title>
            </component>
            <!-- /* c8 ignore next */ -->
            <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/users/sign_out">
              <v-list-item-title>
                <v-icon>mdi-logout</v-icon>
                ログアウト
              </v-list-item-title>
            </component>
          </v-list-group>
        </template>
        <v-divider />
        <!-- /* c8 ignore next */ -->
        <component :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'" to="/infomations">
          <v-list-item-title>
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
              <span class="ml-8">お知らせ</span>
            </template>
            <template v-else>
              <v-icon>mdi-bell</v-icon>
              お知らせ
            </template>
          </v-list-item-title>
        </component>
        <!-- /* c8 ignore next 2 */ -->
        <component
          :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
          v-if="$auth.loggedIn"
          to="/downloads"
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
            <span class="ml-8">ダウンロード結果</span>
          </v-list-item-title>
        </component>
        <!-- /* c8 ignore next 2 */ -->
        <component
          :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
          v-if="$auth.loggedIn || $config.public.enablePublicSpace"
          to="/spaces"
        >
          <v-list-item-title>
            <v-icon>mdi-folder-open</v-icon>
            スペース
          </v-list-item-title>
        </component>
        <template v-if="$auth.loggedIn">
          <!-- /* c8 ignore next 2 */ -->
          <component
            :is="$config.public.env.test ? 'NuxtLink' : 'v-list-item'"
            v-for="space in $auth.user.spaces" :id="`navigation_space_link_${space.code}`"
            :key="space.code"
            :to="`/-/${space.code}`"
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

    <v-main class="mx-2 pb-10">
      <v-container fluid>
        <UsersDestroyInfo />
        <slot />
      </v-container>
    </v-main>

    <v-footer absolute app>
      <div class="flex-grow-1 text-center text-truncate">
        <span class="hidden-sm-and-down">Copyright </span>&copy; <a :href="$t('my_url')" target="_blank" rel="noopener noreferrer">{{ $t('my_name') }}</a> All Rights Reserved.
      </div>
    </v-footer>

    <AppBackToTop />
  </v-app>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'
import UsersDestroyInfo from '~/components/users/DestroyInfo.vue'
import AppBackToTop from '~/components/app/BackToTop.vue'

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth } = useNuxtApp()

useHead({
  titleTemplate
})
function titleTemplate (title: string | undefined) {
  const name = `${$t('app_name')}${$config.public.envName}`
  return title == null ? name : `${title} - ${name}`
}

const drawer = ref(!useDisplay().mobile.value)
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

.md-preview {
  border: ridge;
  border-radius: 4px;
  border-color: #1E1E1E;
  min-height: 32px
}
</style>
