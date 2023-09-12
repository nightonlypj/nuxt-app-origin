<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <NuxtLink to="/" class="toolbar-title d-flex">
        <v-img src="/logo.png" max-width="40px" max-height="40px" />
        <v-app-bar-title
          v-if="$vuetify.display.width > 226"
          :style="{ 'max-width': ($vuetify.display.width - 226) + 'px' }"
          class="ml-1 align-self-center d-inline-block text-truncate"
        >
          {{ `${$t('app_name')}${$t('sub_title')}${$config.public.envName}` }}
        </v-app-bar-title>
      </NuxtLink>
      <v-spacer />
      <template v-if="!$auth.loggedIn">
        <v-btn to="/users/sign_in" text rounded nuxt>
          <v-icon>mdi-login</v-icon>
          <div class="hidden-sm-and-down">ログイン</div>
        </v-btn>
        <v-btn to="/users/sign_up" text rounded nuxt>
          <v-icon>mdi-account-plus</v-icon>
          <div class="hidden-sm-and-down">アカウント登録</div>
        </v-btn>
      </template>
      <template v-else>
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              id="user_menu_btn"
              class="d-inline-block"
              max-width="400px"
              text
            >
              <v-avatar size="32px">
                <v-img id="user_image" :src="$auth.user.image_url.small" />
              </v-avatar>
              <div class="text-truncate hidden-sm-and-down ml-1">{{ $auth.user.name }}</div>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/users/update" nuxt rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-account-edit</v-icon>
                ユーザー情報
              </v-list-item-title>
            </v-list-item>
            <v-list-item to="/users/sign_out" nuxt rounded="xl">
              <v-list-item-title>
                <v-icon>mdi-logout</v-icon>
                ログアウト
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn to="/infomations" text rounded nuxt>
          <v-badge
            :content="$auth.user.infomation_unread_count"
            :model-value="$auth.user.infomation_unread_count > 0"
            max="9"
            color="error"
          >
            <v-icon size="large">mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="300">
      <v-list>
        <template v-if="!$auth.loggedIn">
          <v-list-item to="/users/sign_in" nuxt>
            <v-list-item-title>
              <v-icon>mdi-login</v-icon>
              ログイン
            </v-list-item-title>
          </v-list-item>
          <v-list-item to="/users/sign_up" nuxt>
            <v-list-item-title>
              <v-icon>mdi-account-plus</v-icon>
              アカウント登録
            </v-list-item-title>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-group>
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <v-list-item-title class="d-flex">
                  <v-avatar size="32px">
                    <v-img id="user_image" :src="$auth.user.image_url.small" />
                  </v-avatar>
                  <div class="text-truncate ml-1">{{ $auth.user.name }}</div>
                </v-list-item-title>
              </v-list-item>
            </template>
            <v-list-item to="/users/update" nuxt>
              <v-list-item-title>
                <v-icon>mdi-account-edit</v-icon>
                ユーザー情報
              </v-list-item-title>
            </v-list-item>
            <v-list-item to="/users/sign_out" nuxt>
              <v-list-item-title>
                <v-icon>mdi-logout</v-icon>
                ログアウト
              </v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
        <v-divider />
        <v-list-item to="/infomations" nuxt>
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
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="mx-2">
      <v-container fluid>
        <AppDestroyInfo />
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

<script>
import AppDestroyInfo from '~/components/app/DestroyInfo.vue'
import AppBackToTop from '~/components/app/BackToTop.vue'

export default defineNuxtComponent({
  components: {
    AppDestroyInfo,
    AppBackToTop
  },

  data () {
    return {
      drawer: null
    }
  },

  head () {
    const { t: $t } = useI18n()
    const $config = useRuntimeConfig()
    return {
      titleTemplate: `%s - ${$t('app_name')}${$config.public.envName}`
    }
  },

  created () {
    this.drawer = this.$vuetify.display.width >= 1264 // NOTE: md(Medium)以下の初期表示はメニューを閉じる
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
.v-btn {
  text-transform: none; /* NOTE: 大文字表示になる為 */
}
.v-btn--disabled.v-btn--variant-elevated { /* NOTE: disable時に押せると誤解する為 */
  background-color: transparent !important;
  color: rgba(var(--v-theme-on-surface), 0.26) !important;
}
.v-card-title {
  white-space: normal; /* NOTE: 文字が省略され、折り返されない為 */
}
</style>
